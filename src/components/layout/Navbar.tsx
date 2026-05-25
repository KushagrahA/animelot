"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { NavSearch } from "./NavSearch";
import { AnimelotLogo } from "@/components/brand/AnimelotLogo";
import { ThemeOrb } from "@/components/brand/ThemeOrb";
import { createClient } from "@/lib/supabase/client";
import {
  Menu,
  X,
  MessagesSquare,
  Compass,
  Calendar,
  TrendingUp,
  LogIn,
  LogOut,
  UserCircle2,
} from "lucide-react";

interface NavUser {
  email: string | null;
  name: string;
  avatarUrl: string | null;
}

const navLinks = [
  { href: "/browse", label: "Browse", icon: Compass },
  { href: "/seasonal", label: "Ongoing", icon: Calendar },
  { href: "/community", label: "Community", icon: MessagesSquare },
  { href: "/battles", label: "Worlds", icon: TrendingUp },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navUser, setNavUser] = useState<NavUser | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const readUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setNavUser(
        user
          ? {
              email: user.email ?? null,
              name:
                user.user_metadata?.full_name ??
                user.user_metadata?.name ??
                user.email?.split("@")[0] ??
                "Account",
              avatarUrl: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
            }
          : null
      );
    };

    void readUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void readUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setNavUser(null);
    setMobileOpen(false);
    router.refresh();
  };

  const authControl = navUser ? (
    <div className="nav-account hidden md:flex">
      <Link href="/profile" className="nav-account-link" title={navUser.email ?? navUser.name}>
        {navUser.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={navUser.avatarUrl} alt="" className="nav-account-avatar" />
        ) : (
          <UserCircle2 size={18} />
        )}
        <span>{navUser.name}</span>
      </Link>
      <button type="button" onClick={signOut} aria-label="Sign out" className="nav-signout">
        <LogOut size={15} />
      </button>
    </div>
  ) : (
    <Link
      href="/login"
      id="navbar-signin-btn"
      className="hidden md:flex items-center gap-1.5"
      style={{
        height: 36,
        padding: "0 14px",
        background: "var(--bloodstone)",
        color: "var(--accent-contrast)",
        borderRadius: "var(--radius-md)",
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-sm)",
        fontWeight: 600,
        transition: "opacity var(--transition-fast)",
      }}
    >
      <LogIn size={14} />
      Sign in
    </Link>
  );

  return (
    <>
      <header
        style={{
          background: "var(--vanilla-custard)",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <nav className="site-nav container flex items-center justify-between" style={{ height: 60 }}>
          {/* Logo */}
          <AnimelotLogo className="flex-shrink-0" size="sm" />

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6" style={{ fontSize: "var(--text-sm)" }}>
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative font-medium transition-colors",
                  pathname === href || pathname.startsWith(href + "/")
                    ? "text-[var(--bloodstone)]"
                    : "text-[var(--text)] hover:text-[var(--bloodstone)]"
                )}
                style={{ fontFamily: "var(--font-body)" }}
              >
                {label}
                {(pathname === href || pathname.startsWith(href + "/")) && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: -2,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: "var(--bloodstone)",
                      borderRadius: 1,
                    }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className="nav-actions flex items-center gap-3">
            <NavSearch />

            {/* Auth — desktop */}
            {authControl}

            {/* Mobile menu toggle */}
            <button
              id="navbar-mobile-menu-btn"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              style={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                background: "var(--surface)",
                color: "var(--text)",
                cursor: "pointer",
              }}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            {/* Theme orb — always visible, cycles themes on click */}
            <ThemeOrb />
          </div>
        </nav>
      </header>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99,
            background: "rgba(32,28,24,0.4)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setMobileOpen(false)}
        >
          <nav
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: 280,
              background: "var(--bg)",
              borderLeft: "1px solid var(--border)",
              padding: "var(--space-6)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-lg)",
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: "var(--space-4)",
              }}
            >
              Menu
            </div>
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-base)",
                  fontWeight: 500,
                  color: pathname === href ? "var(--bloodstone)" : "var(--text)",
                  padding: "var(--space-2) 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <Icon size={18} color={pathname === href ? "var(--bloodstone)" : "var(--text-muted)"} />
                {label}
              </Link>
            ))}
            {navUser ? (
              <div className="mobile-account-panel">
                <div className="mobile-account-name">
                  {navUser.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={navUser.avatarUrl} alt="" className="nav-account-avatar" />
                  ) : (
                    <UserCircle2 size={18} />
                  )}
                  <span>{navUser.name}</span>
                </div>
                <button type="button" onClick={signOut} className="mobile-signout">
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                style={{
                  marginTop: "auto",
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--bloodstone)",
                  color: "var(--accent-contrast)",
                  borderRadius: "var(--radius-md)",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  gap: 8,
                }}
              >
                <LogIn size={16} />
                Sign in to Animelot
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
