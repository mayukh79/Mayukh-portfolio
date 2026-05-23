import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useLoading } from "../../context/LoadingProvider";

/*
 * Step 9 replacement: removes the encrypted character.enc model entirely.
 * Replaced with a custom Three.js particle system — a glowing sphere made of
 * orbiting code-like particles that react to mouse movement.
 * No external model files, no decrypt utility, no DRACOLoader needed.
 */

const Scene = () => {
  const canvasDiv = useRef<HTMLDivElement | null>(null);
  const { setLoading, setIsLoading } = useLoading();

  useEffect(() => {
    if (!canvasDiv.current) return;

    const rect = canvasDiv.current.getBoundingClientRect();
    const container = { width: rect.width, height: rect.height };

    // ── Renderer ──────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.width, container.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    canvasDiv.current.appendChild(renderer.domElement);

    // ── Camera ────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(
      60,
      container.width / container.height,
      0.1,
      1000
    );
    camera.position.z = 5;

    // ── Scene ─────────────────────────────────────────────────
    const scene = new THREE.Scene();

    // ── Particle sphere ───────────────────────────────────────
    const PARTICLE_COUNT = 3500;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);

    const colorA = new THREE.Color("#c2a4ff"); // accent purple
    const colorB = new THREE.Color("#ffffff");
    const colorC = new THREE.Color("#7f40ff");

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Fibonacci sphere distribution for even spread
      const phi = Math.acos(1 - (2 * (i + 0.5)) / PARTICLE_COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;

      const radius = 1.6 + (Math.random() - 0.5) * 0.4;
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Mix colours across the sphere
      const t = Math.random();
      const mixed =
        t < 0.5
          ? colorA.clone().lerp(colorB, t * 2)
          : colorB.clone().lerp(colorC, (t - 0.5) * 2);
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;

      sizes[i] = Math.random() * 3 + 1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    // Circular sprite texture drawn on a canvas
    const spriteCanvas = document.createElement("canvas");
    spriteCanvas.width = 64;
    spriteCanvas.height = 64;
    const ctx = spriteCanvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.4, "rgba(194,164,255,0.6)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const sprite = new THREE.CanvasTexture(spriteCanvas);

    const material = new THREE.PointsMaterial({
      size: 0.035,
      map: sprite,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // ── Inner glow sphere ─────────────────────────────────────
    const glowGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: "#3a0080",
      transparent: true,
      opacity: 0.18,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glowMesh);

    // ── Rim light ring (equator) ───────────────────────────────
    const ringGeo = new THREE.TorusGeometry(1.62, 0.006, 8, 200);
    const ringMat = new THREE.MeshBasicMaterial({
      color: "#c2a4ff",
      transparent: true,
      opacity: 0.6,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // ── Mouse tracking ────────────────────────────────────────
    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    document.addEventListener("mousemove", onMouseMove);

    // ── Resize handler ────────────────────────────────────────
    const onResize = () => {
      if (!canvasDiv.current) return;
      const r = canvasDiv.current.getBoundingClientRect();
      renderer.setSize(r.width, r.height);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    // ── Signal loading complete immediately (no model to load) ─
    setLoading(100);
    setTimeout(() => setIsLoading(false), 800);

    // ── Animate ───────────────────────────────────────────────
    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Slow base rotation
      particles.rotation.y = t * 0.08;
      particles.rotation.x = t * 0.03;

      // Mouse parallax tilt
      particles.rotation.y += mouseX * 0.0015;
      particles.rotation.x += mouseY * 0.001;

      glowMesh.rotation.y = particles.rotation.y;
      ring.rotation.z = t * 0.05;

      // Pulse glow opacity
      glowMat.opacity = 0.12 + Math.sin(t * 1.2) * 0.06;

      renderer.render(scene, camera);
    };
    animate();

    // ── Cleanup ───────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      if (canvasDiv.current) {
        canvasDiv.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="character-container">
      <div className="character-model" ref={canvasDiv}>
        <div className="character-rim"></div>
      </div>
    </div>
  );
};

export default Scene;
