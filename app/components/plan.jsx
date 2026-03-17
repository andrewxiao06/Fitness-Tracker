import "./plan.css";
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

const FALLBACK_PLAN = {
  id: 'fallback',
  name: 'Sample Push Day',
};

const FALLBACK_EXERCISES = [
  {
    id: '1',
    exercise_name: 'Bench Press',
    sets_x_reps: '3 x 8',
    weight: 135,
    muscle_group: 'Chest',
  },
  {
    id: '2',
    exercise_name: 'Lat Pulldown',
    sets_x_reps: '3 x 10',
    weight: 110,
    muscle_group: 'Back',
  },
  {
    id: '3',
    exercise_name: 'Squat',
    sets_x_reps: '3 x 5',
    weight: 185,
    muscle_group: 'Legs',
  },
];

export default function Plan() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [todayExercises, setTodayExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const today = new Date().getDay();
  const todayKey = dayNames[today];
  const todayLabel = dayLabels[today];

  useEffect(() => {
    fetchSelectedPlan();
  }, []);

  useEffect(() => {
    if (selectedPlan) {
      fetchTodayExercises();
    }
  }, [selectedPlan]);

  const useFallbackData = () => {
    setSelectedPlan(FALLBACK_PLAN);
    setTodayExercises(FALLBACK_EXERCISES);
    setLoading(false);
  };

  const fetchSelectedPlan = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error fetching user, using fallback plan:', userError);
        useFallbackData();
        return;
      }

      const savedPlanId = typeof window !== 'undefined'
        ? localStorage.getItem('selectedWorkoutPlanId')
        : null;
      
      if (savedPlanId) {
        const { data, error } = await supabase
          .from('weekly_plans')
          .select('*')
          .eq('id', savedPlanId)
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching selected plan, falling back:', error);
          await fetchFirstPlan(user.id);
        } else {
          setSelectedPlan(data);
          setLoading(false);
        }
      } else {
        await fetchFirstPlan(user.id);
      }
    } catch (err) {
      console.error('Supabase unavailable, using fallback plan:', err);
      useFallbackData();
    }
  };

  const fetchFirstPlan = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('weekly_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching first plan, using fallback:', error);
        useFallbackData();
        return;
      }

      if (data && data.length > 0) {
        setSelectedPlan(data[0]);
      } else {
        useFallbackData();
        return;
      }
      setLoading(false);
    } catch (err) {
      console.error('Supabase unavailable when fetching first plan:', err);
      useFallbackData();
    }
  };

  const fetchTodayExercises = async () => {
    if (!selectedPlan) return;

    try {
      const { data, error } = await supabase
        .from('daily_workout_exercises')
        .select('*')
        .eq('weekly_plan_id', selectedPlan.id)
        .eq('day_of_week', todayKey)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching today exercises, using fallback:', error);
        setTodayExercises(FALLBACK_EXERCISES);
      } else {
        setTodayExercises(data || FALLBACK_EXERCISES);
      }
      setLoading(false);
    } catch (err) {
      console.error('Supabase unavailable when fetching exercises:', err);
      setTodayExercises(FALLBACK_EXERCISES);
      setLoading(false);
    }
  };

  const getWorkoutType = (muscleGroup) => {
    if (!muscleGroup) return 'Rest day';
    const lower = muscleGroup.toLowerCase();
    if (lower.includes('push') || lower.includes('chest') || lower.includes('shoulder') || lower.includes('tricep')) return 'Push';
    if (lower.includes('pull') || lower.includes('back') || lower.includes('bicep')) return 'Pull';
    if (lower.includes('leg') || lower.includes('quad') || lower.includes('hamstring') || lower.includes('calf')) return 'Legs';
    if (lower.includes('upper')) return 'Upper';
    if (lower.includes('lower')) return 'Lower';
    if (lower.includes('cardio')) return 'Cardio';
    return 'Other';
  };

  const getWorkoutTypeColor = (muscleGroup) => {
    if (!muscleGroup) return '#6b7280';
    const lower = muscleGroup.toLowerCase();
    if (lower.includes('push') || lower.includes('chest') || lower.includes('shoulder') || lower.includes('tricep')) return '#dc2626';
    if (lower.includes('pull') || lower.includes('back') || lower.includes('bicep')) return '#2563eb';
    if (lower.includes('leg') || lower.includes('quad') || lower.includes('hamstring') || lower.includes('calf')) return '#16a34a';
    if (lower.includes('upper')) return '#7c3aed';
    if (lower.includes('lower')) return '#0d9488';
    if (lower.includes('cardio')) return '#ea580c';
    return '#6b7280';
  };


  if (loading) {
    return (
      <div>
        <div className="plan-container">
          <div className="title">Today's Plan</div>
          <div className="plan-day">Loading...</div>
        </div>
      </div>
    );
  }

  const workoutType = todayExercises.length > 0 
    ? getWorkoutType(todayExercises[0]?.muscle_group)
    : 'Rest day';

  const workoutTypeColor = todayExercises.length > 0 
    ? getWorkoutTypeColor(todayExercises[0]?.muscle_group)
    : '#6b7280';

  return (
    <div>
      <div className="plan-container">
        <div className="title">Today's Plan</div>
        <div 
          className="plan-day"
          style={{ backgroundColor: workoutTypeColor }}
        >
          {workoutType}
        </div>

        <div className="plan-items header-row">
          <span>Exercise</span>
          <span>Sets x Reps</span>
          <span>Weight</span>
          <span>Muscle Group</span>
        </div>
        
        {todayExercises.length > 0 ? (
          todayExercises.map((exercise) => (
            <div key={exercise.id} className="plan-items data-row">
              <span>{exercise.exercise_name}</span>
              <span>{exercise.sets_x_reps}</span>
              <span>{exercise.weight ? `${exercise.weight} lbs` : 'BW'}</span>
              <span>{exercise.muscle_group}</span>
            </div>
          ))
        ) : (
          <div className="plan-items data-row">
            <span>cardio</span>
            <span>0 x 0</span>
            <span>0</span>
            <span>Cardio</span>
          </div>
        )}
      </div>
    </div>
  );
}
