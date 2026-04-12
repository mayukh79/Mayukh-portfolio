import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useLoading } from "../../context/LoadingProvider";

/*
 * Particle sphere with full cursor interaction:
 *
 *  - Each particle stores its own "home" position on the sphere surface.
 *  - A spring force pulls every particle back toward its home every frame.
 *  - The cursor is unprojected into world space each frame and cast as a
 *    3D influence sphere. Particles inside that sphere are:
 *      • REPELLED when the user is just moving (scattered outward).
 *      • ATTRACTED when the user holds the mouse still (hover mode, particles
 *        converge toward the cursor point, creating a glowing vortex).
 *  - Velocity has damping so motion feels fluid and physical.
 *  - The whole sphere still rotates slowly and tilts with cursor position.
 */

const PARTICLE_COUNT = 4000;

// Physics constants — tweak these to taste
const SPRING_K = 0.04;   // how hard particles snap back home
const DAMPING = 0.88;   // velocity decay per frame (0–1)
const REPEL_RADIUS = 1.1;    // world-space repulsion sphere radius
const REPEL_FORCE = 0.18;   // strength of push-away
const ATTRACT_RADIUS = 0.9;    // world-space attraction sphere radius
const ATTRACT_FORCE = 0.12;   // strength of pull-toward
const HOVER_THRESHOLD_MS = 120; // ms of mouse stillness before "hover" mode

const Scene = () => {
  const canvasDiv = useRef<HTMLDivElement | null>(null);
  const { setLoading, setIsLoading } = useLoading();

  useEffect(() => {
    if (!canvasDiv.current) return;

    // ── Renderer ──────────────────────────────────────────────────────────
    const rect = canvasDiv.current.getBoundingClientRect();
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(rect.width, rect.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    canvasDiv.current.appendChild(renderer.domElement);

    // ── Camera ────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(60, rect.width / rect.height, 0.1, 1000);
    camera.position.z = 5;

    // ── Three scene ───────────────────────────────────────────────────────
    const scene = new THREE.Scene();

    // ── Sprite texture (soft glowing dot) ────────────────────────────────
    const spriteCanvas = document.createElement("canvas");
    spriteCanvas.width = 64; spriteCanvas.height = 64;
    const ctx = spriteCanvas.getContext("2d")!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.35, "rgba(194,164,255,0.7)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const sprite = new THREE.CanvasTexture(spriteCanvas);

    // ── Per-particle data ─────────────────────────────────────────────────
    // home positions (never change after init)
    const home = new Float32Array(PARTICLE_COUNT * 3);
    // live positions (written to geometry each frame)
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    // velocities
    const vel = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    const cA = new THREE.Color("#c2a4ff");
    const cB = new THREE.Color("#ffffff");
    const cC = new THREE.Color("#7f40ff");

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Fibonacci sphere — perfectly even distribution
      const phi = Math.acos(1 - (2 * (i + 0.5)) / PARTICLE_COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = 1.55 + (Math.random() - 0.5) * 0.35;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      home[i * 3] = x; home[i * 3 + 1] = y; home[i * 3 + 2] = z;
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      vel[i * 3] = 0; vel[i * 3 + 1] = 0; vel[i * 3 + 2] = 0;

      const t = Math.random();
      const c = t < 0.5 ? cA.clone().lerp(cB, t * 2) : cB.clone().lerp(cC, (t - 0.5) * 2);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }

    const geometry = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(pos, 3); posAttr.setUsage(THREE.DynamicDrawUsage);
    const colorAttr = new THREE.BufferAttribute(colors, 3);
    geometry.setAttribute("position", posAttr);
    geometry.setAttribute("color", colorAttr);

    const material = new THREE.PointsMaterial({
      size: 0.032,
      map: sprite,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // ── Glow core ─────────────────────────────────────────────────────────
    const glowGeo = new THREE.SphereGeometry(1.15, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({ color: "#3a0080", transparent: true, opacity: 0.18 });
    scene.add(new THREE.Mesh(glowGeo, glowMat));

    // ── Equator ring ──────────────────────────────────────────────────────
    const ringGeo = new THREE.TorusGeometry(1.58, 0.005, 8, 200);
    const ringMat = new THREE.MeshBasicMaterial({ color: "#c2a4ff", transparent: true, opacity: 0.5 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // ── Cursor repulsor visual (small glowing dot at cursor hit point) ────
    const repulsorGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const repulsorMat = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0 });
    const repulsorMesh = new THREE.Mesh(repulsorGeo, repulsorMat);
    scene.add(repulsorMesh);

    // ── Mouse / hover state ───────────────────────────────────────────────
    // NDC mouse (-1..1)
    const mouse = new THREE.Vector2(9999, 9999); // off-screen initially
    // World-space cursor point (on a virtual plane at z=0)
    const cursorWorld = new THREE.Vector3();
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    let isHovering = false;  // true when mouse is still
    let lastMouseMoveTime = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      lastMouseMoveTime = performance.now();
      isHovering = false;
    };
    document.addEventListener("mousemove", onMouseMove);

    // Touch support
    const onTouchMove = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      mouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
      lastMouseMoveTime = performance.now();
      isHovering = false;
    };
    document.addEventListener("touchmove", onTouchMove, { passive: true });

    // ── Resize ────────────────────────────────────────────────────────────
    const onResize = () => {
      if (!canvasDiv.current) return;
      const r = canvasDiv.current.getBoundingClientRect();
      renderer.setSize(r.width, r.height);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    // ── Loading done immediately ───────────────────────────────────────────
    setLoading(100);
    setTimeout(() => setIsLoading(false), 800);

    // ── Working vectors (reused every frame to avoid GC pressure) ─────────
    const pVec = new THREE.Vector3();
    const hVec = new THREE.Vector3();
    const diff = new THREE.Vector3();
    const force = new THREE.Vector3();

    // sphere-rotation state (smooth lerp targets)
    let rotY = 0, rotX = 0;
    let targetRotY = 0, targetRotX = 0;

    const clock = new THREE.Clock();
    let animId: number;

    // ── Animation loop ─────────────────────────────────────────────────────
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const now = performance.now();

      // Determine hover mode
      if (!isHovering && now - lastMouseMoveTime > HOVER_THRESHOLD_MS) {
        isHovering = true;
      }

      // Unproject cursor to world space (z=0 plane)
      raycaster.setFromCamera(mouse, camera);
      raycaster.ray.intersectPlane(plane, cursorWorld);

      // Move visual repulsor to cursor point
      repulsorMesh.position.copy(cursorWorld);
      repulsorMat.opacity = isHovering ? 0.5 : 0.15;

      // ── Sphere rotation (lerp to mouse-driven target) ──────────────────
      targetRotY = t * 0.07 + mouse.x * 0.4;
      targetRotX = t * 0.025 + mouse.y * 0.25;
      rotY += (targetRotY - rotY) * 0.03;
      rotX += (targetRotX - rotX) * 0.03;
      particles.rotation.y = rotY;
      particles.rotation.x = rotX;
      ring.rotation.z = t * 0.04;
      glowMat.opacity = 0.12 + Math.sin(t * 1.1) * 0.06;

      // ── Per-particle physics ───────────────────────────────────────────
      // We need cursor position in the local space of the particles object
      // so forces align with the (rotated) sphere.
      const invMatrix = new THREE.Matrix4().copy(particles.matrixWorld).invert();

      // cursor in particle local space
      const localCursor = cursorWorld.clone().applyMatrix4(invMatrix);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const ix = i * 3, iy = ix + 1, iz = ix + 2;

        // Current live position
        pVec.set(pos[ix], pos[iy], pos[iz]);

        // Home position
        hVec.set(home[ix], home[iy], home[iz]);

        // Spring: pull toward home
        force.copy(hVec).sub(pVec).multiplyScalar(SPRING_K);

        // Distance from particle to cursor (in local space)
        diff.copy(pVec).sub(localCursor);
        const dist = diff.length();

        if (isHovering) {
          // ATTRACT — particles converge toward cursor
          if (dist < ATTRACT_RADIUS && dist > 0.001) {
            const strength = ATTRACT_FORCE * (1 - dist / ATTRACT_RADIUS);
            force.add(diff.normalize().multiplyScalar(-strength));
          }
        } else {
          // REPEL — particles scatter away from cursor
          if (dist < REPEL_RADIUS && dist > 0.001) {
            const strength = REPEL_FORCE * (1 - dist / REPEL_RADIUS);
            // Extra kick when cursor is very close
            const kick = dist < 0.3 ? 2.5 : 1;
            force.add(diff.normalize().multiplyScalar(strength * kick));
          }
        }

        // Integrate velocity
        vel[ix] = vel[ix] * DAMPING + force.x;
        vel[iy] = vel[iy] * DAMPING + force.y;
        vel[iz] = vel[iz] * DAMPING + force.z;

        // Clamp max velocity so nothing flies off to infinity
        const speed = Math.sqrt(vel[ix] * vel[ix] + vel[iy] * vel[iy] + vel[iz] * vel[iz]);
        if (speed > 0.12) {
          const inv = 0.12 / speed;
          vel[ix] *= inv; vel[iy] *= inv; vel[iz] *= inv;
        }

        // Update position
        pos[ix] += vel[ix];
        pos[iy] += vel[iy];
        pos[iz] += vel[iz];
      }

      posAttr.needsUpdate = true;
      renderer.render(scene, camera);
    };
    animate();

    // ── Cleanup ───────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      repulsorGeo.dispose();
      repulsorMat.dispose();
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
