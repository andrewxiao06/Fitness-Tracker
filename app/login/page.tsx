"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (window as any).handleSignInWithGoogle = async (response: any) => {
      setSigningIn(true);
      setError(null);
      try {
        const { error: signInError } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.credential,
        });
        if (signInError) {
          setError(signInError.message);
          setSigningIn(false);
          return;
        }
        location.href = "/";
      } catch (e: any) {
        setError(e?.message ?? "Sign-in failed");
        setSigningIn(false);
      }
    };
  }, [supabase]);

  const enterDemoMode = () => {
    document.cookie = "ft_demo=1; Path=/; Max-Age=31536000; SameSite=Lax";
    location.href = "/";
  };

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" async />
      <div style={{ maxWidth: 420, margin: "48px auto", padding: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
          Sign in alternatively
        </h1>
        {error ? (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        ) : null}
        <p style={{ color: "#6b7280", marginBottom: 12 }}>
          If Google login is not working, you can still view the app in demo
          mode with static data.
        </p>
        <button
          type="button"
          onClick={enterDemoMode}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            background: "#111827",
            color: "white",
            fontWeight: 600,
            marginBottom: 16,
            cursor: "pointer",
          }}
        >
          Continue in demo mode
        </button>
        {signingIn ? (
          <div style={{ color: "#6b7280", marginBottom: 12 }}>
            Signing you in…
          </div>
        ) : null}
      </div>
      <div
        id="g_id_onload"
        data-client_id={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
        data-context="signin"
        data-ux_mode="popup"
        data-callback="handleSignInWithGoogle"
        data-auto_prompt="false"
        data-use_fedcm_for_prompt="true"
      />
      <div
        className="g_id_signin"
        data-type="standard"
        data-shape="rectangular"
        data-theme="outline"
        data-text="signin_with"
        data-size="large"
        data-logo_alignment="left"
      />
    </>
  );
}
