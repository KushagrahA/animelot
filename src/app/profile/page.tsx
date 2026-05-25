import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AnimelotLogo } from "@/components/brand/AnimelotLogo";
import { CalendarDays, MessageCircle, Star, UserCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Your Profile",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="container profile-shell">
        <div className="profile-card">
          <AnimelotLogo showWordmark={false} size="lg" href="" />
          <h1>Sign in to see your Animelot profile.</h1>
          <Link href="/login" className="profile-primary-link">
            Sign in
          </Link>
        </div>
      </section>
    );
  }

  const [{ data: profile }, { count: ratingCount }, { count: reviewCount }, { count: watchCount }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("ratings").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("ratings").select("id", { count: "exact", head: true }).eq("user_id", user.id).not("review", "is", null),
    supabase.from("watch_status").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const displayName =
    profile?.display_name ??
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "Animelot User";
  const avatarUrl = profile?.avatar_url ?? user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null;

  return (
    <section className="container profile-shell">
      <div className="profile-card">
        <div className="profile-hero">
          <div className="profile-avatar">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" />
            ) : (
              <UserCircle2 size={42} />
            )}
          </div>
          <div>
            <p className="profile-kicker">@{profile?.username ?? "animelot_user"}</p>
            <h1>{displayName}</h1>
            <p>{user.email}</p>
          </div>
        </div>

        <div className="profile-stats">
          <div>
            <Star size={18} />
            <strong>{ratingCount ?? 0}</strong>
            <span>Ratings</span>
          </div>
          <div>
            <MessageCircle size={18} />
            <strong>{reviewCount ?? 0}</strong>
            <span>Reviews</span>
          </div>
          <div>
            <CalendarDays size={18} />
            <strong>{watchCount ?? 0}</strong>
            <span>Watchlist</span>
          </div>
        </div>

        <div className="profile-actions">
          <Link href="/browse" className="profile-primary-link">
            Rate more anime
          </Link>
          <Link href="/seasonal" className="profile-secondary-link">
            Ongoing chart
          </Link>
        </div>
      </div>
    </section>
  );
}
