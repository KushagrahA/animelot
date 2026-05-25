"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("If an account exists for that email, a reset link has been sent.");
    } catch {
      setMessage("Password reset is unavailable until Supabase environment variables are configured.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-shell" style={{ minHeight: "calc(100vh - 60px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-8) var(--space-4)" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--bloodstone)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "var(--space-6)" }}>
          <ArrowLeft size={16} />
          Back to sign in
        </Link>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "var(--space-8)", boxShadow: "var(--shadow-lg)" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontStyle: "italic", fontWeight: 750 }}>
            Reset your password
          </h1>
          <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", lineHeight: 1.6, marginTop: "var(--space-2)", marginBottom: "var(--space-6)" }}>
            Enter your account email and we&apos;ll send a reset link.
          </p>
          {message ? (
            <div role="status" style={{ background: "var(--bloodstone-faint)", border: "1px solid rgba(93,13,24,0.2)", color: "var(--bloodstone)", borderRadius: "var(--radius-md)", padding: "var(--space-3)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
              {message}
            </div>
          ) : null}
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "var(--space-4)" }}>
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
                  style={{ width: "100%", height: 44, padding: "0 var(--space-4) 0 40px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--bg)", color: "var(--text)", outline: 0 }}
                />
              </span>
            </label>
            <button type="submit" disabled={loading} style={{ height: 44, background: loading ? "var(--misty-sage)" : "var(--bloodstone)", color: "#FFF9EB", border: 0, borderRadius: "var(--radius-md)", fontFamily: "var(--font-body)", fontSize: "var(--text-base)", fontWeight: 750, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
