import Image from "next/image";
import Link from "next/link";

interface AnimelotLogoProps {
  href?: string;
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}

const sizes = {
  sm: { mark: 38, word: 24 },
  md: { mark: 52, word: 34 },
  lg: { mark: 76, word: 48 },
};

function LogoInner({ size = "sm", showWordmark = true }: Pick<AnimelotLogoProps, "size" | "showWordmark">) {
  const dim = sizes[size];

  return (
    <>
      <span
        className="brand-mark"
        aria-hidden="true"
        style={{
          width: dim.mark,
          height: dim.mark,
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Image
          src="/animelot-logo-transparent.png"
          alt=""
          width={dim.mark}
          height={dim.mark}
          decoding="async"
          sizes={`${dim.mark}px`}
          style={{
            display: "block",
            height: "100%",
            objectFit: "contain",
            width: "100%",
          }}
        />
      </span>
      {showWordmark ? (
        <span style={{ display: "inline-flex", alignItems: "baseline", minWidth: 0 }}>
          <span
            className="brand-word"
            style={{
              color: "var(--text)",
              fontFamily: "var(--font-body)",
              fontSize: dim.word,
              fontWeight: 500,
              lineHeight: 0.9,
              letterSpacing: "0.035em",
            }}
          >
            animelot
          </span>
          <span
            className="brand-domain"
            style={{
              color: "var(--bloodstone)",
              fontFamily: "var(--font-body)",
              fontSize: Math.round(dim.word * 0.78),
              fontWeight: 500,
              lineHeight: 0.9,
              letterSpacing: "0.025em",
              marginLeft: 4,
            }}
          >
            .com
          </span>
        </span>
      ) : null}
    </>
  );
}

export function AnimelotLogo({ href = "/", size = "sm", showWordmark = true, className }: AnimelotLogoProps) {
  const content = <LogoInner size={size} showWordmark={showWordmark} />;

  if (!href) {
    return (
      <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
        {content}
      </span>
    );
  }

  return (
    <Link href={href} className={className} aria-label="Animelot home" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      {content}
    </Link>
  );
}
