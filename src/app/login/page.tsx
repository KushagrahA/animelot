"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AnimelotLogo } from "@/components/brand/AnimelotLogo";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setAuthMessage(error.message);
        return;
      }

      const redirect = new URLSearchParams(window.location.search).get("redirect") || "/";
      router.replace(redirect);
      router.refresh();
    } catch {
      setAuthMessage("Sign in is unavailable until Supabase environment variables are configured.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "discord") => {
    setLoading(true);
    setAuthMessage(null);

    try {
      const redirect = new URLSearchParams(window.location.search).get("redirect") || "/";
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
        },
      });

      if (error) setAuthMessage(error.message);
    } catch {
      setAuthMessage("OAuth is unavailable until Supabase environment variables are configured.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 60px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-8) var(--space-4)",
        background: "var(--bg)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-8)" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--space-4)" }}>
            <AnimelotLogo href="" size="md" showWordmark={false} />
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-2xl)",
              fontWeight: 700,
              fontStyle: "italic",
              color: "var(--text)",
              marginBottom: "var(--space-2)",
            }}
          >
            Welcome back
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
            Sign in to your Animelot account
          </p>
        </div>

        {/* Form card */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-xl)",
            padding: "var(--space-8)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {/* OAuth buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
            <button
              id="login-google-btn"
              type="button"
              onClick={() => void handleOAuth("google")}
              disabled={loading}
              style={{
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--space-3)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                background: "var(--bg)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                color: "var(--text)",
                cursor: "pointer",
                transition: "border-color var(--transition-fast)",
              }}
              className="hover:border-[var(--bloodstone)]"
            >
              <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/><path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
              Continue with Google
            </button>
            <button
              id="login-discord-btn"
              type="button"
              onClick={() => void handleOAuth("discord")}
              disabled={loading}
              style={{
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--space-3)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                background: "#5865F2",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                color: "#FFFFFF",
                cursor: "pointer",
                transition: "opacity var(--transition-fast)",
              }}
              className="hover:opacity-90"
            >
              <svg width="18" height="14" viewBox="0 0 18 14" fill="white"><path d="M15.25 1.19A14.6 14.6 0 0011.5 0c-.18.32-.38.75-.52 1.09a13.57 13.57 0 00-4 0C6.83.75 6.62.32 6.44 0A14.52 14.52 0 002.7 1.2 15.44 15.44 0 00.09 11.55a14.7 14.7 0 004.47 2.26 10.73 10.73 0 00.95-1.53 9.56 9.56 0 01-1.5-.72l.36-.28a10.42 10.42 0 008.96 0c.12.1.24.19.36.28-.48.28-.98.52-1.5.72.27.55.58 1.07.95 1.53a14.64 14.64 0 004.48-2.27A15.35 15.35 0 0015.25 1.19zM6.17 9.47c-.87 0-1.58-.79-1.58-1.76s.7-1.77 1.58-1.77 1.59.8 1.58 1.77c0 .97-.7 1.76-1.58 1.76zm5.66 0c-.87 0-1.58-.79-1.58-1.76s.7-1.77 1.58-1.77 1.58.8 1.58 1.77c0 .97-.7 1.76-1.58 1.76z"/></svg>
              Continue with Discord
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {authMessage && (
            <div
              role="alert"
              style={{
                background: "var(--bloodstone-faint)",
                border: "1px solid rgba(93,13,24,0.2)",
                color: "var(--bloodstone)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-3)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                marginBottom: "var(--space-4)",
              }}
            >
              {authMessage}
            </div>
          )}

          {/* Email form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div>
              <label htmlFor="login-email" style={{ display: "block", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--text)", marginBottom: "var(--space-2)" }}>
                Email
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  style={{
                    width: "100%",
                    height: 44,
                    paddingLeft: 40,
                    paddingRight: "var(--space-4)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg)",
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-sm)",
                    color: "var(--text)",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                <label htmlFor="login-password" style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--text)" }}>
                  Password
                </label>
                <Link href="/forgot-password" style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--bloodstone)" }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    height: 44,
                    paddingLeft: 40,
                    paddingRight: 44,
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg)",
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-sm)",
                    color: "var(--text)",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    padding: 0,
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              style={{
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--space-2)",
                background: loading ? "var(--misty-sage)" : "var(--bloodstone)",
                color: "#FFF9EB",
                border: "none",
                borderRadius: "var(--radius-md)",
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-base)",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "opacity var(--transition-fast)",
                marginTop: "var(--space-2)",
              }}
            >
              {loading ? "Signing in…" : (
                <>
                  Sign in
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--text-muted)", marginTop: "var(--space-6)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: "var(--bloodstone)", fontWeight: 600 }}>
            Join Animelot
          </Link>
        </p>
      </div>
    </div>
  );
}
