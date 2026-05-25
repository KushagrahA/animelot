"use client";

import { useEffect, useRef } from "react";

/**
 * InkHero — WebGL ink-fluid simulation using Three.js.
 * Dynamically imported (no SSR) from the homepage.
 * Uses ping-pong framebuffer technique for fluid advection.
 * Falls back gracefully on mobile and prefers-reduced-motion.
 */
export function InkHero() {
  const mountRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Abort on mobile or reduced motion
    if (window.innerWidth < 768) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let mounted = true;

    const init = async () => {
      const THREE = await import("three");

      if (!mounted || !mountRef.current) return;

      const container = mountRef.current;
      const W = container.clientWidth;
      const H = container.clientHeight;

      // ── Renderer ──────────────────────────────────────────
      const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(W, H);
      renderer.setClearColor(0xfff9eb, 0); // transparent
      container.appendChild(renderer.domElement);

      // ── Render targets for ping-pong ─────────────────────
      const rtOptions = {
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: false,
      };
      let rtA = new THREE.WebGLRenderTarget(W / 4, H / 4, rtOptions);
      let rtB = new THREE.WebGLRenderTarget(W / 4, H / 4, rtOptions);

      const simScene = new THREE.Scene();
      const simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      // ── Fluid advection shader ────────────────────────────
      const advectMat = new THREE.ShaderMaterial({
        vertexShader: `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
        `,
        fragmentShader: `
          uniform sampler2D u_velocity;
          uniform float u_dt;
          uniform float u_dissipation;
          varying vec2 vUv;
          void main() {
            vec2 vel = texture2D(u_velocity, vUv).xy;
            vec2 prevPos = vUv - vel * u_dt;
            prevPos = clamp(prevPos, 0.0, 1.0);
            vec4 col = texture2D(u_velocity, prevPos);
            gl_FragColor = col * u_dissipation;
          }
        `,
        uniforms: {
          u_velocity: { value: null },
          u_dt: { value: 0.016 },
          u_dissipation: { value: 0.992 },
        },
      });

      // ── Ink render shader ─────────────────────────────────
      const inkMat = new THREE.ShaderMaterial({
        vertexShader: `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
        `,
        fragmentShader: `
          uniform sampler2D u_fluid;
          uniform float u_time;
          varying vec2 vUv;

          // Simple noise
          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
          float noise(vec2 p) {
            vec2 i = floor(p), f = fract(p);
            float a = hash(i), b = hash(i + vec2(1,0));
            float c = hash(i + vec2(0,1)), d = hash(i + vec2(1,1));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
          }

          void main() {
            vec4 fluid = texture2D(u_fluid, vUv);
            float speed = length(fluid.xy);

            // Ink color: bloodstone tint that fades
            float n = noise(vUv * 4.0 + u_time * 0.05);
            float alpha = speed * 2.5 + n * 0.08;
            alpha = clamp(alpha, 0.0, 0.18);

            // Mix between misty-sage and bloodstone based on speed
            vec3 sageColor = vec3(0.624, 0.698, 0.675);       // #9FB2AC
            vec3 bloodColor = vec3(0.365, 0.051, 0.094);      // #5D0D18

            vec3 inkColor = mix(sageColor, bloodColor, smoothstep(0.0, 0.3, speed));
            gl_FragColor = vec4(inkColor, alpha);
          }
        `,
        uniforms: {
          u_fluid: { value: null },
          u_time: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
      });

      const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), advectMat);
      simScene.add(quad);

      // ── Main render scene ─────────────────────────────────
      const renderScene = new THREE.Scene();
      const renderCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const renderQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), inkMat);
      renderScene.add(renderQuad);

      // ── Splat helper (adds ink impulses) ──────────────────
      const splatMat = new THREE.ShaderMaterial({
        vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`,
        fragmentShader: `
          uniform sampler2D u_target;
          uniform vec2 u_point;
          uniform vec2 u_velocity;
          uniform float u_radius;
          varying vec2 vUv;
          void main() {
            vec2 p = vUv - u_point;
            float d = exp(-dot(p, p) / u_radius);
            vec4 col = texture2D(u_target, vUv);
            gl_FragColor = col + vec4(u_velocity * d, 0.0, d * 0.5);
          }
        `,
        uniforms: {
          u_target:   { value: null },
          u_point:    { value: new THREE.Vector2(0.5, 0.5) },
          u_velocity: { value: new THREE.Vector2(0.002, 0.001) },
          u_radius:   { value: 0.003 },
        },
      });
      const splatQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), splatMat);

      // ── Auto splats (gentle ambient ink movement) ─────────
      const addSplat = (x: number, y: number, vx: number, vy: number) => {
        splatQuad.material = splatMat;
        splatMat.uniforms.u_target.value = rtA.texture;
        splatMat.uniforms.u_point.value.set(x, y);
        splatMat.uniforms.u_velocity.value.set(vx, vy);
        simScene.remove(quad);
        simScene.add(splatQuad);
        renderer.setRenderTarget(rtB);
        renderer.render(simScene, simCamera);
        [rtA, rtB] = [rtB, rtA];
        simScene.remove(splatQuad);
        simScene.add(quad);
      };

      // Seed with initial splats
      addSplat(0.3, 0.5, 0.003, 0.001);
      addSplat(0.7, 0.4, -0.002, 0.002);
      addSplat(0.5, 0.7, 0.001, -0.003);

      // ── Mouse interaction ─────────────────────────────────
      let lastMouse = { x: 0.5, y: 0.5 };
      const onMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = 1 - (e.clientY - rect.top) / rect.height;
        const vx = (x - lastMouse.x) * 5;
        const vy = (y - lastMouse.y) * 5;
        if (Math.abs(vx) + Math.abs(vy) > 0.001) {
          addSplat(x, y, vx, vy);
        }
        lastMouse = { x, y };
      };
      container.addEventListener("mousemove", onMouseMove);

      // ── IntersectionObserver (pause when off screen) ──────
      let isVisible = true;
      const observer = new IntersectionObserver(
        ([entry]) => { isVisible = entry.isIntersecting; },
        { threshold: 0 }
      );
      observer.observe(container);

      // ── Auto-splat timer ──────────────────────────────────
      let t = 0;
      const autoSplatInterval = setInterval(() => {
        const x = 0.2 + Math.random() * 0.6;
        const y = 0.2 + Math.random() * 0.6;
        const angle = Math.random() * Math.PI * 2;
        addSplat(x, y, Math.cos(angle) * 0.002, Math.sin(angle) * 0.002);
      }, 2000);

      // ── Animation loop ────────────────────────────────────
      let raf: number;
      const animate = () => {
        if (!mounted) return;
        raf = requestAnimationFrame(animate);
        if (!isVisible) return;

        t += 0.016;

        // Advect
        advectMat.uniforms.u_velocity.value = rtA.texture;
        quad.material = advectMat;
        renderer.setRenderTarget(rtB);
        renderer.render(simScene, simCamera);
        [rtA, rtB] = [rtB, rtA];

        // Render ink
        inkMat.uniforms.u_fluid.value = rtA.texture;
        inkMat.uniforms.u_time.value = t;
        renderer.setRenderTarget(null);
        renderer.render(renderScene, renderCamera);
      };
      animate();

      // ── Cleanup ───────────────────────────────────────────
      cleanupRef.current = () => {
        mounted = false;
        cancelAnimationFrame(raf);
        clearInterval(autoSplatInterval);
        observer.disconnect();
        container.removeEventListener("mousemove", onMouseMove);
        renderer.dispose();
        rtA.dispose();
        rtB.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    };

    // Defer init until after LCP
    const id = requestIdleCallback ? requestIdleCallback(() => init()) : setTimeout(init, 100);

    return () => {
      mounted = false;
      if (typeof id === "number") clearTimeout(id);
      cleanupRef.current?.();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      role="presentation"
      aria-hidden="true"
      style={{
        width: "100%",
        height: "clamp(200px, 35vh, 380px)",
        position: "relative",
        overflow: "hidden",
        background: "var(--vanilla-custard)",
        cursor: "crosshair",
      }}
    >
      {/* Gradient overlay at bottom — fades canvas into page content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, transparent 0%, transparent 60%, var(--vanilla-custard) 100%)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
      {/* Centered headline */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
          pointerEvents: "none",
          padding: "0 var(--space-6)",
          textAlign: "center",
        }}
      >
        <h1
          className="display"
          style={{
            color: "var(--text)",
            marginBottom: "var(--space-3)",
            maxWidth: 640,
          }}
        >
          Your anime, rated.
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-lg)",
            color: "var(--text-muted)",
            maxWidth: 480,
            lineHeight: 1.5,
          }}
        >
          Discover what the community loves. Share what you think.
        </p>
      </div>
    </div>
  );
}
