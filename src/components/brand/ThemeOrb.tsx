"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";

/* ── Theme cycle order ─────────────────────────────────── */
const THEMES = ["paper", "night-ink"] as const;
type ThemeName = (typeof THEMES)[number];

/* ── Vertex shader (fullscreen triangle strip) ─────────── */
const VERT = `
  attribute vec2 a_pos;
  void main() {
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

/* ── Fragment shader: iridescent fluid orb ──────────────── */
const FRAG = `
  precision highp float;

  uniform float u_time;
  uniform vec2  u_res;
  uniform float u_theme;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash12(i),             hash12(i + vec2(1.0,0.0)), u.x),
      mix(hash12(i + vec2(0.0,1.0)), hash12(i + vec2(1.0,1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 rot = mat2(0.8660, 0.5, -0.5, 0.8660);
    for (int i = 0; i < 6; i++) {
      v += a * noise(p);
      p  = rot * p * 2.07 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }

  float fluid(vec2 p, float t) {
    vec2 q = vec2(
      fbm(p + vec2(0.0, 0.0) + t * 0.13),
      fbm(p + vec2(5.2, 1.3) + t * 0.11)
    );
    vec2 r = vec2(
      fbm(p + 4.2 * q + vec2(1.7, 9.2) + t * 0.07),
      fbm(p + 4.2 * q + vec2(8.3, 2.8) + t * 0.09)
    );
    return fbm(p + 4.5 * r + t * 0.04);
  }

  vec3 pal(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
  }

  float caustic(vec2 uv, float t) {
    float c = 0.0;
    for (int i = 1; i <= 4; i++) {
      float fi  = float(i);
      vec2  off = vec2(cos(t * 0.18 * fi + fi), sin(t * 0.14 * fi)) * 0.22;
      float r   = length(uv - off);
      c += abs(sin(r * 14.0 - t * 0.7 * fi));
    }
    return c * 0.25;
  }

  void main() {
    vec2 uv     = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
    float r     = length(uv);
    float alpha = smoothstep(0.505, 0.465, r);
    if (alpha <= 0.0) { gl_FragColor = vec4(0.0); return; }

    vec2  sph = uv * 2.02;
    float zz  = max(0.001, 1.0 - dot(sph, sph));
    vec3  N   = normalize(vec3(sph, sqrt(zz)));

    float t  = u_time * 0.38;
    float f1 = fluid(uv * 3.5, t);
    float f2 = fluid(uv * 2.8 + vec2(2.3, 4.1), t * 0.72);
    float cst = caustic(uv, u_time);

    vec3 colA, colB;
    float th = u_theme;

    if (th < 0.5) {
      colA = pal(f1 + t * 0.05,
        vec3(0.70, 0.52, 0.40), vec3(0.30, 0.26, 0.20),
        vec3(1.00, 0.82, 0.62), vec3(0.00, 0.22, 0.52));
      colB = pal(f2 + cst * 0.28 + t * 0.06,
        vec3(0.76, 0.36, 0.30), vec3(0.20, 0.24, 0.28),
        vec3(0.92, 1.00, 0.68), vec3(0.10, 0.34, 0.44));
    } else if (th < 1.5) {
      colA = pal(f1 + t * 0.05,
        vec3(0.18, 0.12, 0.36), vec3(0.42, 0.32, 0.34),
        vec3(0.78, 0.92, 1.00), vec3(0.28, 0.50, 0.72));
      colB = pal(f2 + cst * 0.36 + t * 0.06,
        vec3(0.36, 0.08, 0.42), vec3(0.32, 0.22, 0.26),
        vec3(1.00, 0.78, 0.48), vec3(0.00, 0.24, 0.62));
    } else {
      colA = pal(f1 + t * 0.05,
        vec3(0.36, 0.58, 0.52), vec3(0.22, 0.30, 0.24),
        vec3(0.82, 1.00, 0.82), vec3(0.20, 0.42, 0.62));
      colB = pal(f2 + cst * 0.28 + t * 0.08,
        vec3(0.28, 0.48, 0.60), vec3(0.22, 0.20, 0.32),
        vec3(0.90, 0.72, 1.00), vec3(0.10, 0.32, 0.52));
    }

    vec3 col = mix(colA, colB, cst * 0.62 + 0.18);

    for (int i = 0; i < 14; i++) {
      float fi    = float(i);
      float spd   = 0.28 + fi * 0.051;
      float phase = fi * 2.39996;
      float orbit = 0.08 + hash12(vec2(fi, 7.3)) * 0.26;

      vec2 pos = orbit * vec2(
        sin(u_time * spd + phase),
        cos(u_time * spd * 0.71 + phase + 1.2)
      );

      float d     = length(uv - pos);
      float glow  = exp(-d * d * 110.0);
      float hue   = fi / 14.0 + u_time * 0.04 + f1 * 0.3;
      vec3 spkCol = pal(hue,
        vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5),
        vec3(1.0, 0.72, 0.46), vec3(0.00, 0.14, 0.26));
      col += spkCol * glow * 0.72;
    }

    float fresnel = pow(1.0 - N.z, 2.6);
    vec3  iridCol = pal(fresnel * 0.85 + f1 * 0.25 + t * 0.04,
      vec3(0.5, 0.5, 0.5), vec3(0.5, 0.5, 0.5),
      vec3(1.0, 0.68, 0.48), vec3(0.00, 0.10, 0.22));
    col = mix(col, iridCol, fresnel * 0.48);

    vec3 L1   = normalize(vec3( 0.42,  0.72, 1.00));
    float sp1 = pow(max(dot(reflect(-L1, N), vec3(0.0,0.0,1.0)), 0.0), 36.0);
    col += vec3(1.00, 0.97, 0.94) * sp1 * 0.92;

    vec3 L2   = normalize(vec3(-0.48, -0.52, 0.72));
    float sp2 = pow(max(dot(reflect(-L2, N), vec3(0.0,0.0,1.0)), 0.0), 8.0);
    col += vec3(0.52, 0.72, 1.00) * sp2 * 0.18;

    col += vec3(0.22, 0.16, 0.34) * fresnel * 0.32;
    col += vec3(1.00, 0.96, 0.90) * pow(cst, 3.2) * 0.44;
    col  = pow(max(col, vec3(0.0)), vec3(0.88));
    col *= 0.88 + 0.12 * (1.0 - r * 2.0);
    col *= smoothstep(0.50, 0.08, r * 0.5);

    gl_FragColor = vec4(col, alpha);
  }
`;

/* ── WebGL helpers ──────────────────────────────────────── */
function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

function buildProgram(gl: WebGLRenderingContext) {
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  return prog;
}

/* ── Component ──────────────────────────────────────────── */
export function ThemeOrb() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const rafRef      = useRef<number>(0);
  const uThemeRef   = useRef<WebGLUniformLocation | null>(null);
  const uTimeRef    = useRef<WebGLUniformLocation | null>(null);
  const themeIdxRef = useRef<number>(0);
  const startRef    = useRef<number>(0);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const themeIdx = theme === "night-ink" ? 1 : 0;
  themeIdxRef.current = themeIdx;

  useEffect(() => { setMounted(true); }, []);

  /* ── WebGL initialisation ─────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr  = Math.min(window.devicePixelRatio ?? 1, 2);
    const SIZE = 40;
    canvas.width  = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width  = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;

    const gl = canvas.getContext("webgl", {
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
    });
    if (!gl) return;

    const prog = buildProgram(gl);
    gl.useProgram(prog);

    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1,-1, 1,-1, -1,1, 1,1]),
      gl.STATIC_DRAW
    );
    const posLoc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    uTimeRef.current  = gl.getUniformLocation(prog, "u_time");
    uThemeRef.current = gl.getUniformLocation(prog, "u_theme");
    const uResLoc     = gl.getUniformLocation(prog, "u_res");

    gl.uniform2f(uResLoc, canvas.width, canvas.height);
    gl.uniform1f(uThemeRef.current!, themeIdxRef.current);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.viewport(0, 0, canvas.width, canvas.height);

    startRef.current = performance.now();

    const loop = () => {
      const elapsed = (performance.now() - startRef.current) / 1000;
      gl.uniform1f(uTimeRef.current!,  elapsed);
      gl.uniform1f(uThemeRef.current!, themeIdxRef.current);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(rafRef.current);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, []);

  /* ── Sync theme to Supabase profile (background) ─────── */
  const syncThemeToDb = async (t: string) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("profiles")
        .update({ theme: t as ThemeName })
        .eq("id", user.id);
    } catch { /* silent */ }
  };

  const handleClick = () => {
    const cur  = THEMES.indexOf((theme ?? "paper") as ThemeName);
    const next = THEMES[(cur + 1) % THEMES.length];
    setTheme(next);
    void syncThemeToDb(next);
  };

  const label = mounted
    ? `Theme: ${theme ?? "paper"} — click to change`
    : "Change theme";

  return (
    <button
      onClick={handleClick}
      aria-label={label}
      title={label}
      style={{
        position:       "relative",
        width:          40,
        height:         40,
        borderRadius:   "50%",
        padding:        0,
        border:         "none",
        background:     "transparent",
        cursor:         "pointer",
        flexShrink:     0,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        boxShadow:      "0 0 0 1.5px rgba(159,178,172,0.4), 0 2px 10px rgba(32,28,24,0.14)",
        transition:     "box-shadow 200ms ease, transform 180ms ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          "0 0 0 2px rgba(93,13,24,0.5), 0 4px 18px rgba(32,28,24,0.22)";
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.10)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          "0 0 0 1.5px rgba(159,178,172,0.4), 0 2px 10px rgba(32,28,24,0.14)";
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ borderRadius: "50%", display: "block", pointerEvents: "none" }}
      />
    </button>
  );
}
