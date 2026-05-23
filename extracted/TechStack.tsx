import * as THREE from "three";
import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { EffectComposer, N8AO } from "@react-three/postprocessing";
import {
  BallCollider,
  Physics,
  RigidBody,
  CylinderCollider,
  RapierRigidBody,
} from "@react-three/rapier";

// ── Your actual tech stack ────────────────────────────────────────────────────
// Drop matching .webp icons into public/images/ with these exact names.
const TECH_ITEMS = [
  { url: "/images/python.webp"      },
  { url: "/images/django.webp"      },
  { url: "/images/react2.webp"      },
  { url: "/images/javascript.webp"  },
  { url: "/images/git.webp"         },
  { url: "/images/github.webp"      },
  { url: "/images/mysql.webp"       },
  { url: "/images/linux.webp"       },
];

// Pre-load textures once — outside component so they survive re-renders
const textureLoader = new THREE.TextureLoader();
const textures = TECH_ITEMS.map(({ url }) => {
  const t = textureLoader.load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
});

// Shared geometry
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);

// 28 spheres so icons repeat naturally
const SPHERE_COUNT = 28;
const spheres = Array.from({ length: SPHERE_COUNT }, () => ({
  scale: [0.65, 0.8, 0.9, 1.0, 1.1][Math.floor(Math.random() * 5)],
}));

// ── Cursor → world-space converter ───────────────────────────────────────────
// Runs inside Canvas so it has access to the R3F camera/size
function useCursorWorld() {
  const { camera, size } = useThree();
  const cursor = useRef(new THREE.Vector3(0, 100, 0)); // start off-screen

  useEffect(() => {
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const hit = new THREE.Vector3();

    const onMove = (e: PointerEvent) => {
      ndc.set(
        (e.clientX / size.width) * 2 - 1,
        -(e.clientY / size.height) * 2 + 1
      );
      ray.setFromCamera(ndc, camera);
      ray.ray.intersectPlane(plane, hit);
      cursor.current.copy(hit);
    };

    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [camera, size]);

  return cursor;
}

// ── Kinematic pointer collider ────────────────────────────────────────────────
function Pointer() {
  const bodyRef = useRef<RapierRigidBody>(null);
  const cursor = useCursorWorld();

  useFrame(() => {
    bodyRef.current?.setNextKinematicTranslation(cursor.current);
  });

  return (
    <RigidBody
      position={[0, 100, 0]}
      type="kinematicPosition"
      colliders={false}
      ref={bodyRef}
    >
      {/* 2.4 radius so balls start reacting slightly before cursor touches them */}
      <BallCollider args={[2.4]} />
    </RigidBody>
  );
}

// ── Single physics ball ───────────────────────────────────────────────────────
type SphereProps = {
  scale: number;
  material: THREE.MeshPhysicalMaterial;
  hoverMaterial: THREE.MeshPhysicalMaterial;
};

function SphereGeo({ scale, material, hoverMaterial }: SphereProps) {
  const bodyRef  = useRef<RapierRigidBody>(null);
  const meshRef  = useRef<THREE.Mesh>(null);
  const impulse  = useRef(new THREE.Vector3());
  const [hovered, setHovered] = useState(false);

  // Smooth scale refs to avoid React re-renders every frame
  const targetScale  = useRef(scale);
  const currentScale = useRef(scale);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    targetScale.current = hovered ? scale * 1.38 : scale;
  }, [hovered, scale]);

  useEffect(() => {
    return () => { document.body.style.cursor = "auto"; };
  }, []);

  useFrame((_state, delta) => {
    if (!bodyRef.current || !meshRef.current) return;
    delta = Math.min(0.1, delta);

    // Pull balls back toward origin (zero-gravity spring)
    const { x, y, z } = bodyRef.current.translation();
    impulse.current
      .set(x, y, z)
      .normalize()
      .multiplyScalar(-55 * delta * scale);
    bodyRef.current.applyImpulse(impulse.current, true);

    // Smooth scale lerp
    currentScale.current +=
      (targetScale.current - currentScale.current) * 0.14;
    meshRef.current.scale.setScalar(currentScale.current);

    // Material swap
    meshRef.current.material = hovered ? hoverMaterial : material;
  });

  const r = THREE.MathUtils.randFloatSpread;

  return (
    <RigidBody
      linearDamping={0.85}
      angularDamping={0.25}
      friction={0.3}
      restitution={0.35}
      position={[r(18), r(18) - 4, r(8)]}
      ref={bodyRef}
      colliders={false}
    >
      <BallCollider args={[scale]} />
      <CylinderCollider
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 1.2 * scale]}
        args={[0.15 * scale, 0.28 * scale]}
      />
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        scale={scale}
        geometry={sphereGeometry}
        material={material}
        rotation={[0.3, 1, 1]}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true);  }}
        onPointerOut={()  => setHovered(false)}
      />
    </RigidBody>
  );
}

// ── TechStack ─────────────────────────────────────────────────────────────────
const TechStack = () => {
  const [sectionVisible, setSectionVisible] = useState(false);

  // Mount physics only once the section scrolls into view
  // This prevents wasted simulation on page load
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setSectionVisible(true); },
      { threshold: 0.05 }
    );
    const el = document.querySelector(".techstack");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { materials, hoverMaterials } = useMemo(() => {
    const base = textures.map(
      (tex) =>
        new THREE.MeshPhysicalMaterial({
          map: tex,
          emissive: "#ffffff",
          emissiveMap: tex,
          emissiveIntensity: 0.28,
          metalness: 0.45,
          roughness: 0.9,
          clearcoat: 0.15,
        })
    );
    const hover = textures.map(
      (tex) =>
        new THREE.MeshPhysicalMaterial({
          map: tex,
          emissive: "#c2a4ff",   // accent purple glow on hover
          emissiveMap: tex,
          emissiveIntensity: 1.0,
          metalness: 0.6,
          roughness: 0.45,
          clearcoat: 0.7,
          clearcoatRoughness: 0.08,
        })
    );
    return { materials: base, hoverMaterials: hover };
  }, []);

  return (
    <div className="techstack">
      <h2>My Techstack</h2>
      <Canvas
        shadows
        gl={{ alpha: true, stencil: false, depth: false, antialias: true }}
        camera={{ position: [0, 0, 20], fov: 32.5, near: 1, far: 100 }}
        onCreated={(state) => (state.gl.toneMappingExposure = 1.5)}
        className="tech-canvas"
      >
        <ambientLight intensity={1} />
        <spotLight
          position={[20, 20, 25]}
          penumbra={1}
          angle={0.2}
          color="white"
          castShadow
          shadow-mapSize={[512, 512]}
        />
        <directionalLight position={[0, 5, -4]} intensity={2} />

        {sectionVisible && (
          <Physics gravity={[0, 0, 0]}>
            {/*
              Pointer is NOT gated behind any isActive flag.
              It reads cursor position every frame regardless of scroll position.
            */}
            <Pointer />
            {spheres.map((props, i) => (
              <SphereGeo
                key={i}
                scale={props.scale}
                material={materials[i % materials.length]}
                hoverMaterial={hoverMaterials[i % hoverMaterials.length]}
              />
            ))}
          </Physics>
        )}

        <Environment
          files="/models/char_enviorment.hdr"
          environmentIntensity={0.5}
          environmentRotation={[0, 4, 2]}
        />
        <EffectComposer enableNormalPass={false}>
          <N8AO color="#0f002c" aoRadius={2} intensity={1.15} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default TechStack;
