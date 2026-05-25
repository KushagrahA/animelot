"use client";

import { useEffect, useRef } from "react";

export function InkConstellation() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    if (window.innerWidth < 768) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let active = true;
    let cleanup: (() => void) | undefined;

    const init = async () => {
      const THREE = await import("three");
      if (!active || !mountRef.current) return;

      const container = mountRef.current;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.set(0, 0, 8);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0xfff9eb, 0);
      container.appendChild(renderer.domElement);

      const group = new THREE.Group();
      scene.add(group);

      const dotGeometry = new THREE.SphereGeometry(0.028, 12, 12);
      const dotMaterial = new THREE.MeshBasicMaterial({
        color: 0x5d0d18,
        transparent: true,
        opacity: 0.5,
      });

      for (let i = 0; i < 90; i++) {
        const dot = new THREE.Mesh(dotGeometry, dotMaterial);
        dot.position.set(
          (Math.random() - 0.5) * 9,
          (Math.random() - 0.5) * 5.5,
          (Math.random() - 0.5) * 2
        );
        group.add(dot);
      }

      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x9fb2ac,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
      });

      for (let i = 0; i < 7; i++) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.5 + i * 0.11, 0.006, 8, 96),
          ringMaterial
        );
        ring.position.set(-3.6 + i * 1.2, -1.4 + Math.sin(i) * 0.8, -0.2);
        ring.rotation.set(Math.random() * 0.4, Math.random() * 0.4, Math.random() * 1.4);
        group.add(ring);
      }

      const sealGeometry = new THREE.CircleGeometry(0.46, 64);
      const sealMaterial = new THREE.MeshBasicMaterial({
        color: 0x5d0d18,
        transparent: true,
        opacity: 0.18,
      });
      const seal = new THREE.Mesh(sealGeometry, sealMaterial);
      seal.position.set(2.8, 0.7, -0.4);
      seal.rotation.set(0.1, -0.2, -0.08);
      group.add(seal);

      const resize = () => {
        if (!mountRef.current) return;
        const { clientWidth, clientHeight } = mountRef.current;
        renderer.setSize(clientWidth, clientHeight);
        camera.aspect = clientWidth / Math.max(clientHeight, 1);
        camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener("resize", resize);

      let visible = true;
      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
      });
      observer.observe(container);

      let raf = 0;
      const animate = () => {
        raf = requestAnimationFrame(animate);
        if (!visible || !active) return;
        const time = performance.now() * 0.00035;
        group.rotation.y = Math.sin(time) * 0.08;
        group.rotation.x = Math.cos(time * 0.8) * 0.035;
        seal.rotation.z += 0.0018;
        renderer.render(scene, camera);
      };
      animate();

      cleanup = () => {
        active = false;
        cancelAnimationFrame(raf);
        observer.disconnect();
        window.removeEventListener("resize", resize);
        renderer.dispose();
        dotGeometry.dispose();
        dotMaterial.dispose();
        ringMaterial.dispose();
        sealGeometry.dispose();
        sealMaterial.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    };

    const idleId = window.setTimeout(() => void init(), 80);

    return () => {
      active = false;
      window.clearTimeout(idleId);
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      role="presentation"
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      data-webgl-ink="constellation"
    />
  );
}
