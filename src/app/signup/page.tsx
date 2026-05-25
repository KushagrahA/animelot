"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Lock, Mail, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AnimelotLogo } from "@/components/brand/AnimelotLogo";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: displayName,
            preferred_username: displayName
              .toLowerCase()
              .replace(/[^a-z0-9_]+/g, "_")
              .replace(/^_+|_+$/g, "")
              .slice(0, 20),
          },
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Check your email to confirm your Animelot account.");
    } catch {
      setMessage("Signup is unavailable until Supabase environment variables are configured.");
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
      <div style={{ width: "100%", maxWidth: 440 }}>
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
            Join Animelot
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
            Start building your anime taste archive.
          </p>
        </div>

        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-8)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {message && (
            <div
              role="status"
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
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <label style={{ display: "grid", gap: "var(--space-2)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", fontWeight: 600 }}>
              Display name
              <span style={{ position: "relative" }}>
                <UserRound size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  required
                  minLength={3}
                  maxLength={50}
                  placeholder="Aiko"
                  style={{
                    width: "100%",
                    height: 44,
                    padding: "0 var(--space-4) 0 40px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg)",
                    color: "var(--text)",
                    outline: 0,
                  }}
                />
              </span>
            </label>

            <label style={{ display: "grid", gap: "var(--space-2)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", fontWeight: 600 }}>
              Email
              <span style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  placeholder="you@example.com"
                  style={{
                    width: "100%",
                    height: 44,
                    padding: "0 var(--space-4) 0 40px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg)",
                    color: "var(--text)",
                    outline: 0,
                  }}
                />
              </span>
            </label>

            <label style={{ display: "grid", gap: "var(--space-2)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", fontWeight: 600 }}>
              Password
              <span style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  type="password"
                  placeholder="Minimum 8 characters"
                  style={{
                    width: "100%",
                    height: 44,
                    padding: "0 var(--space-4) 0 40px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg)",
                    color: "var(--text)",
                    outline: 0,
                  }}
                />
              </span>
            </label>

            <button
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
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: "var(--space-2)",
              }}
            >
              {loading ? "Creating account..." : "Create account"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--text-muted)", marginTop: "var(--space-6)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--bloodstone)", fontWeight: 700 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
