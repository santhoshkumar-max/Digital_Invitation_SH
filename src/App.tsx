/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, useProgress } from '@react-three/drei';

interface DoorsProps {
  openProgress: number;
  scrollProgress: number;
}

const PalaceDoors: React.FC<DoorsProps> = ({ openProgress, scrollProgress }) => {
  const leftDoorRef = useRef<THREE.Group>(null);
  const rightDoorRef = useRef<THREE.Group>(null);
  const currentRotRef = useRef<number>(0);

  const [frameTexture, leftDoorTexture, rightDoorTexture] = useTexture([
    '/assets/entrance_frame.png?v=day',
    '/assets/ref_door_left.png?v=day',
    '/assets/ref_door_right.png?v=day',
  ]) as [THREE.Texture, THREE.Texture, THREE.Texture];

  useMemo(() => {
    [frameTexture, leftDoorTexture, rightDoorTexture].forEach((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
    });
  }, [frameTexture, leftDoorTexture, rightDoorTexture]);

  const frameHeight = 10;
  const frameWidth = (1024 / 1536) * frameHeight;
  const totalDoorWidth = (216 / 1536) * frameHeight;
  const doorHeight = (300 / 1536) * frameHeight;
  const singleDoorWidth = totalDoorWidth / 2;
  const doorThickness = 0.045;
  const maxOpenAngle = Math.PI * 0.54;

  const centerOffsetX = (-1 / 1024) * frameWidth;
  const centerOffsetY = (-20 / 1536) * frameHeight;
  const hingeLeftX = centerOffsetX - singleDoorWidth;
  const hingeRightX = centerOffsetX + singleDoorWidth;

  const woodEdgeMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: new THREE.Color('#381b0a') }),
    []
  );

  const opacity = useMemo(() => {
    if (scrollProgress <= 0.55) return 1;
    if (scrollProgress >= 0.75) return 0;
    return 1 - (scrollProgress - 0.55) / 0.2;
  }, [scrollProgress]);

  const frameMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: frameTexture,
        transparent: true,
        side: THREE.DoubleSide,
        opacity,
      }),
    [frameTexture, opacity]
  );

  const leftDoorMaterials = useMemo(() => {
    const doorFaceMat = new THREE.MeshBasicMaterial({
      map: leftDoorTexture,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
    });
    return [woodEdgeMat, woodEdgeMat, woodEdgeMat, woodEdgeMat, doorFaceMat, doorFaceMat];
  }, [leftDoorTexture, woodEdgeMat, opacity]);

  const rightDoorMaterials = useMemo(() => {
    const doorFaceMat = new THREE.MeshBasicMaterial({
      map: rightDoorTexture,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
    });
    return [woodEdgeMat, woodEdgeMat, woodEdgeMat, woodEdgeMat, doorFaceMat, doorFaceMat];
  }, [rightDoorTexture, woodEdgeMat, opacity]);

  useFrame((_, delta) => {
    const targetAngle = openProgress * maxOpenAngle;
    currentRotRef.current = THREE.MathUtils.damp(
      currentRotRef.current,
      targetAngle,
      7,
      delta
    );
    if (leftDoorRef.current) {
      leftDoorRef.current.rotation.y = currentRotRef.current;
    }
    if (rightDoorRef.current) {
      rightDoorRef.current.rotation.y = -currentRotRef.current;
    }
  });

  if (opacity <= 0.001) return null;

  return (
    <group position={[0, 0, 0]}>
      {/* Archway Entrance Frame */}
      <mesh position={[0, 0, 0]} material={frameMaterial}>
        <planeGeometry args={[frameWidth, frameHeight]} />
      </mesh>

      {/* Left jamb reveal */}
      <mesh
        position={[hingeLeftX, centerOffsetY, -doorThickness / 2]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[doorThickness * 2, doorHeight]} />
        <meshBasicMaterial color="#381b0a" transparent opacity={opacity} />
      </mesh>

      {/* Right jamb reveal */}
      <mesh
        position={[hingeRightX, centerOffsetY, -doorThickness / 2]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <planeGeometry args={[doorThickness * 2, doorHeight]} />
        <meshBasicMaterial color="#381b0a" transparent opacity={opacity} />
      </mesh>

      {/* Top lintel reveal */}
      <mesh
        position={[centerOffsetX, centerOffsetY + doorHeight / 2, -doorThickness / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[totalDoorWidth, doorThickness * 2]} />
        <meshBasicMaterial color="#381b0a" transparent opacity={opacity} />
      </mesh>

      {/* Bottom sill reveal */}
      <mesh
        position={[centerOffsetX, centerOffsetY - doorHeight / 2, -doorThickness / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[totalDoorWidth, doorThickness * 2]} />
        <meshBasicMaterial color="#2a1407" transparent opacity={opacity} />
      </mesh>

      {/* Left palace door */}
      <group ref={leftDoorRef} position={[hingeLeftX, centerOffsetY, 0]}>
        <mesh
          position={[singleDoorWidth / 2, 0, -doorThickness / 2]}
          material={leftDoorMaterials}
        >
          <boxGeometry args={[singleDoorWidth, doorHeight, doorThickness]} />
        </mesh>
      </group>

      {/* Right palace door */}
      <group ref={rightDoorRef} position={[hingeRightX, centerOffsetY, 0]}>
        <mesh
          position={[-singleDoorWidth / 2, 0, -doorThickness / 2]}
          material={rightDoorMaterials}
        >
          <boxGeometry args={[singleDoorWidth, doorHeight, doorThickness]} />
        </mesh>
      </group>
    </group>
  );
};

// 20 Falling rose petals with floating drift physics
const FallingPetals: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummyObj = useMemo(() => new THREE.Object3D(), []);

  const petals = useMemo(() => {
    return Array.from({ length: 20 }, () => ({
      x: (Math.random() - 0.5) * 5,
      y: Math.random() * 5 - 1.5,
      z: 0.1,
      rotX: Math.random() * Math.PI * 2,
      rotY: Math.random() * Math.PI * 2,
      rotZ: Math.random() * Math.PI * 2,
      speedY: 0.003 + Math.random() * 0.005,
      driftFreq: 1 + Math.random() * 1.5,
      driftPhase: Math.random() * Math.PI * 2,
      scale: 0.025 + Math.random() * 0.02,
      rotSpeed: (Math.random() - 0.5) * 0.015,
      color: Math.random() > 0.3 ? '#f472b6' : '#fda4af',
    }));
  }, []);

  const petalMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true, opacity: 0.85 }),
    []
  );

  useEffect(() => {
    if (meshRef.current) {
      petals.forEach((p, idx) => {
        meshRef.current?.setColorAt(idx, new THREE.Color(p.color));
      });
      if (meshRef.current.instanceColor) {
        meshRef.current.instanceColor.needsUpdate = true;
      }
    }
  }, [petals]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const elapsed = clock.getElapsedTime();

    petals.forEach((p, idx) => {
      p.y -= p.speedY;
      const drift = Math.sin(elapsed * p.driftFreq + p.driftPhase) * 0.004 + 0.001;
      p.x += drift;
      p.rotX += p.rotSpeed;
      p.rotZ += p.rotSpeed * 1.3;

      if (p.y < -2.4) {
        p.y = 3.6;
        p.x = (Math.random() - 0.5) * 4.5;
      }

      dummyObj.position.set(p.x, p.y, p.z);
      dummyObj.rotation.set(p.rotX, p.rotY, p.rotZ);
      dummyObj.scale.set(p.scale, p.scale * 1.4, p.scale * 0.2);
      dummyObj.updateMatrix();

      meshRef.current?.setMatrixAt(idx, dummyObj.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, petalMaterial, 20]}>
      <sphereGeometry args={[1, 6, 6]} />
    </instancedMesh>
  );
};

// 3 Flying white doves with realistic wing flapping
interface FlyingDovesProps {
  scrollProgress: number;
}

const FlyingDoves: React.FC<FlyingDovesProps> = ({ scrollProgress }) => {
  const rootGroupRef = useRef<THREE.Group>(null);
  const dove1GroupRef = useRef<THREE.Group>(null);
  const dove2GroupRef = useRef<THREE.Group>(null);
  const dove3GroupRef = useRef<THREE.Group>(null);

  const dove1WingRef = useRef<THREE.Group>(null);
  const dove2WingRef = useRef<THREE.Group>(null);
  const dove3WingRef = useRef<THREE.Group>(null);

  const doveTexture = useTexture('/assets/white_dove_flying.png') as THREE.Texture;
  useMemo(() => {
    doveTexture.colorSpace = THREE.SRGBColorSpace;
    doveTexture.minFilter = THREE.LinearMipmapLinearFilter;
    doveTexture.magFilter = THREE.LinearFilter;
  }, [doveTexture]);

  const doveMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: doveTexture,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [doveTexture]
  );

  const dove1Data = useRef({ x: 4.2, baseY: 1.15, speed: 0.5 });
  const dove3Data = useRef({ x: -4.4, baseY: 1.72, speed: 0.38 });

  useFrame(({ clock }, delta) => {
    const elapsed = clock.getElapsedTime();
    const doveOpacity = THREE.MathUtils.clamp((scrollProgress - 0.8) / 0.15, 0, 1);

    doveMaterial.opacity = doveOpacity;
    if (rootGroupRef.current) {
      rootGroupRef.current.visible = doveOpacity > 0.001;
    }
    if (doveOpacity <= 0.001) return;

    // Dove 1
    const d1 = dove1Data.current;
    d1.x -= d1.speed * delta;
    if (d1.x < -4.8) {
      d1.x = 4.4;
      d1.baseY = 1.05 + Math.random() * 0.3;
    }
    const cycle1 = (elapsed + 0) % 3.6;
    const flapEnv1 = cycle1 < 2.4 ? Math.sin((cycle1 / 2.4) * Math.PI) : 0;
    const wingFlap1 = Math.sin(elapsed * 7.5) * flapEnv1;
    const bodyBob1 = Math.sin(elapsed * 2.2) * 0.045;

    if (dove1GroupRef.current) {
      dove1GroupRef.current.position.set(d1.x, d1.baseY + bodyBob1, 0.06);
      dove1GroupRef.current.rotation.z = Math.cos(elapsed * 2.2) * 0.07 - 0.04;
      dove1GroupRef.current.rotation.y = 0;
    }
    if (dove1WingRef.current) {
      const flapScaleY = 0.88 + wingFlap1 * 0.3;
      dove1WingRef.current.scale.set(1, flapScaleY, 1);
    }

    // Dove 2
    const cycle2 = (elapsed + 0.8) % 3.4;
    const flapEnv2 = cycle2 < 2.2 ? Math.sin((cycle2 / 2.2) * Math.PI) : 0;
    const wingFlap2 = Math.sin(elapsed * 7 + 1.2) * flapEnv2;
    const bodyBob2 = Math.sin(elapsed * 2 + 0.6) * 0.04;

    if (dove2GroupRef.current) {
      dove2GroupRef.current.position.set(d1.x + 0.68, d1.baseY + 0.32 + bodyBob2, 0.05);
      dove2GroupRef.current.rotation.z = Math.cos(elapsed * 2 + 0.6) * 0.06 - 0.03;
      dove2GroupRef.current.rotation.y = 0;
    }
    if (dove2WingRef.current) {
      const flapScaleY = 0.88 + wingFlap2 * 0.28;
      dove2WingRef.current.scale.set(0.82, 0.82 * flapScaleY, 0.82);
    }

    // Dove 3
    const d3 = dove3Data.current;
    d3.x += d3.speed * delta;
    if (d3.x > 4.6) {
      d3.x = -4.6;
      d3.baseY = 1.6 + Math.random() * 0.25;
    }
    const cycle3 = (elapsed + 1.5) % 3.8;
    const flapEnv3 = cycle3 < 2 ? Math.sin((cycle3 / 2) * Math.PI) : 0;
    const wingFlap3 = Math.sin(elapsed * 6.5) * flapEnv3;
    const bodyBob3 = Math.sin(elapsed * 1.8) * 0.035;

    if (dove3GroupRef.current) {
      dove3GroupRef.current.position.set(d3.x, d3.baseY + bodyBob3, 0.04);
      dove3GroupRef.current.rotation.z = -Math.cos(elapsed * 1.8) * 0.05 + 0.03;
      dove3GroupRef.current.rotation.y = Math.PI;
    }
    if (dove3WingRef.current) {
      const flapScaleY = 0.9 + wingFlap3 * 0.25;
      dove3WingRef.current.scale.set(0.65, 0.65 * flapScaleY, 0.65);
    }
  });

  return (
    <group ref={rootGroupRef} renderOrder={5} visible={false}>
      <group ref={dove1GroupRef}>
        <group ref={dove1WingRef}>
          <mesh material={doveMaterial}>
            <planeGeometry args={[0.55, 0.42]} />
          </mesh>
        </group>
      </group>

      <group ref={dove2GroupRef}>
        <group ref={dove2WingRef}>
          <mesh material={doveMaterial}>
            <planeGeometry args={[0.55, 0.42]} />
          </mesh>
        </group>
      </group>

      <group ref={dove3GroupRef}>
        <group ref={dove3WingRef}>
          <mesh material={doveMaterial}>
            <planeGeometry args={[0.55, 0.42]} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

interface Screen2Props {
  scrollProgress: number;
}

const Screen2Scene: React.FC<Screen2Props> = ({ scrollProgress }) => {
  const screen2Texture = useTexture('/assets/exact_screen2.png') as THREE.Texture;

  useMemo(() => {
    screen2Texture.colorSpace = THREE.SRGBColorSpace;
    screen2Texture.minFilter = THREE.LinearMipmapLinearFilter;
    screen2Texture.magFilter = THREE.LinearFilter;
    screen2Texture.generateMipmaps = true;
  }, [screen2Texture]);

  const timeRef = useRef<{ value: number }>({ value: 0 });

  useFrame(({ clock }) => {
    timeRef.current.value = clock.getElapsedTime();
  });

  const animatedMaterial = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      map: screen2Texture,
      side: THREE.DoubleSide,
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = timeRef.current;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
         varying vec2 vCustomUv;`
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <uv_vertex>',
        `#include <uv_vertex>
         vCustomUv = uv;`
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
         uniform float uTime;
         varying vec2 vCustomUv;`
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        vec2 animatedUv = vCustomUv;
        float x_px = animatedUv.x * 1024.0;
        float y_px = (1.0 - animatedUv.y) * 1418.0;

        // 1. LEFT BRASS BELL HARMONIC PENDULUM SWING
        // Pivot at top chain ring (x=195, y=475)
        float px_l = 195.0;
        float py_l = 475.0;
        float dx_l = x_px - px_l;
        float dy_l = y_px - py_l;
        float dist_l = sqrt(dx_l * dx_l + dy_l * dy_l);
        if (dist_l < 145.0 && dy_l > -10.0) {
          float angle_l = sin(uTime * 1.6) * 0.052;
          float weight_l = clamp((145.0 - dist_l) / 130.0, 0.0, 1.0) * smoothstep(-10.0, 20.0, dy_l);
          float a = angle_l * weight_l;
          float cos_a = cos(a);
          float sin_a = sin(a);
          x_px = px_l + (dx_l * cos_a - dy_l * sin_a);
          y_px = py_l + (dx_l * sin_a + dy_l * cos_a);
        }

        // 2. RIGHT BRASS BELL HARMONIC PENDULUM SWING
        // Pivot at top chain ring (x=828, y=475)
        float px_r = 828.0;
        float py_r = 475.0;
        float dx_r = x_px - px_r;
        float dy_r = y_px - py_r;
        float dist_r = sqrt(dx_r * dx_r + dy_r * dy_r);
        if (dist_r < 145.0 && dy_r > -10.0) {
          float angle_r = sin(uTime * 1.42 + 1.3) * 0.048;
          float weight_r = clamp((145.0 - dist_r) / 130.0, 0.0, 1.0) * smoothstep(-10.0, 20.0, dy_r);
          float a = angle_r * weight_r;
          float cos_a = cos(a);
          float sin_a = sin(a);
          x_px = px_r + (dx_r * cos_a - dy_r * sin_a);
          y_px = py_r + (dx_r * sin_a + dy_r * cos_a);
        }

        // 3. HANGING FLOWERS BREEZE SWAY (STRICTLY BELOW STONE ARCH)
        // Parabolic inner rim of the ornate scalloped stone arch
        float dx_arch = (x_px - 512.0) / 220.0;
        float y_arch = 285.0 + dx_arch * dx_arch * 125.0;

        if (x_px >= 280.0 && x_px <= 744.0 && y_px > (y_arch + 8.0) && y_px < 425.0) {
          float flower_weight = clamp((y_px - (y_arch + 8.0)) / 65.0, 0.0, 1.0);
          float arch_mask = smoothstep(280.0, 320.0, x_px) * (1.0 - smoothstep(704.0, 744.0, x_px));
          float sway = (sin(uTime * 1.8 + x_px * 0.02) * 4.2 + cos(uTime * 2.5 + x_px * 0.035) * 1.8) * flower_weight * arch_mask;
          x_px += sway;
        }

        vec2 finalUv = vec2(x_px / 1024.0, 1.0 - (y_px / 1418.0));
        vec4 sampledColor = texture2D(map, finalUv);
        diffuseColor *= sampledColor;
        `
      );
    };

    return mat;
  }, [screen2Texture]);

  const planeHeight = 10;
  const planeWidth = (1024 / 1418) * planeHeight;

  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0, 0]} material={animatedMaterial}>
        <planeGeometry args={[planeWidth, planeHeight]} />
      </mesh>
      <FlyingDoves scrollProgress={scrollProgress} />
      <FallingPetals />
    </group>
  );
};

interface CameraControllerProps {
  scrollProgress: number;
  setDoorProgress: (val: number) => void;
}

const CameraController: React.FC<CameraControllerProps> = ({ scrollProgress, setDoorProgress }) => {
  const { camera } = useThree();
  const currentScrollRef = useRef(0);
  const targetLookAt = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  const planeHeight = 10;
  const frameWidth = (1024 / 1536) * planeHeight;
  const doorOffsetX = (-1 / 1024) * frameWidth;
  const doorOffsetY = (-20 / 1536) * planeHeight;
  const fovRad = (45 * Math.PI) / 180;
  const fitZ = (planeHeight / 2 / Math.tan(fovRad / 2)) * 0.995;

  useFrame((_, delta) => {
    currentScrollRef.current = THREE.MathUtils.damp(currentScrollRef.current, scrollProgress, 14, delta);
    const sp = currentScrollRef.current;

    let targetZ = fitZ;
    let targetY = 0;
    let targetX = 0;

    // Approach toward doors
    if (sp <= 0.45) {
      const t = THREE.MathUtils.smoothstep(sp / 0.45, 0, 1);
      targetZ = THREE.MathUtils.lerp(fitZ, 2.6, t);
      targetY = THREE.MathUtils.lerp(0, doorOffsetY, t);
      targetX = THREE.MathUtils.lerp(0, doorOffsetX, t);
    } 
    // Gliding through doorway
    else if (sp <= 0.75) {
      const t = THREE.MathUtils.smoothstep((sp - 0.45) / 0.3, 0, 1);
      targetZ = THREE.MathUtils.lerp(2.6, 0.15, t);
      targetY = doorOffsetY;
      targetX = doorOffsetX;
    } else {
      targetZ = 0.15;
      targetY = doorOffsetY;
      targetX = doorOffsetX;
    }

    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 12, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 12, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 12, delta);

    targetLookAt.set(targetX, targetY, 0);
    camera.lookAt(targetLookAt);

    // Doors open between 0.35 and 0.60
    const openStart = 0.35;
    const openEnd = 0.60;
    let doorVal = 0;
    if (sp > openStart) {
      const normalized = (sp - openStart) / (openEnd - openStart);
      const clamped = Math.min(Math.max(normalized, 0), 1);
      doorVal = clamped * clamped * (3 - 2 * clamped);
    }
    setDoorProgress(doorVal);
  });

  return null;
};

const CameraFit: React.FC<{ fitZ: number }> = ({ fitZ }) => {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.set(0, 0, fitZ);
    camera.lookAt(0, 0, 0);
  });
  return null;
};

const SceneLighting: React.FC = () => (
  <>
    <ambientLight color="#ffffff" intensity={1} />
    <directionalLight position={[2, 8, 8]} intensity={1.2} color="#ffe8c2" />
    <pointLight position={[-0.012, 4.87, 1.8]} color="#ffc368" intensity={4} distance={4.5} decay={2} />
  </>
);

interface Scene3DProps {
  scrollProgress: number;
}

const Scene3D: React.FC<Scene3DProps> = ({ scrollProgress }) => {
  const [doorProgress, setDoorProgress] = useState(0);
  const fovRad = (45 * Math.PI) / 180;
  const fitZ = (10 / 2 / Math.tan(fovRad / 2)) * 0.995;

  return (
    <>
      <div className="fixed inset-0 w-full h-full z-0 bg-[#080506]">
        <Canvas
          gl={{
            antialias: true,
            toneMapping: THREE.NoToneMapping,
            powerPreference: 'high-performance',
          }}
          camera={{ fov: 45, near: 0.1, far: 50, position: [0, 0, fitZ] }}
          dpr={[1, Math.min(window.devicePixelRatio, 2)]}
        >
          <color attach="background" args={['#080506']} />
          <Suspense fallback={null}>
            <SceneLighting />
            <Screen2Scene scrollProgress={scrollProgress} />
            <CameraFit fitZ={fitZ} />
          </Suspense>
        </Canvas>
      </div>

      <div className="fixed inset-0 w-full h-full z-10 pointer-events-none bg-transparent">
        <Canvas
          gl={{
            alpha: true,
            antialias: true,
            toneMapping: THREE.NoToneMapping,
            powerPreference: 'high-performance',
          }}
          camera={{ fov: 45, near: 0.1, far: 50, position: [0, 0, fitZ] }}
          dpr={[1, Math.min(window.devicePixelRatio, 2)]}
        >
          <Suspense fallback={null}>
            <SceneLighting />
            <PalaceDoors openProgress={doorProgress} scrollProgress={scrollProgress} />
            <CameraController scrollProgress={scrollProgress} setDoorProgress={setDoorProgress} />
          </Suspense>
        </Canvas>
      </div>
    </>
  );
};

const LoadingOverlay: React.FC<{ onLoaded?: () => void }> = ({ onLoaded }) => {
  const { progress, active } = useProgress();
  const [isFading, setIsFading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (progress >= 100 && !active) {
      const timer = setTimeout(() => {
        setIsFading(true);
        if (onLoaded) onLoaded();
        const unmountTimer = setTimeout(() => setIsDone(true), 600);
        return () => clearTimeout(unmountTimer);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [progress, active, onLoaded]);

  if (isDone) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#080506] transition-opacity duration-700 ease-out ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative w-40 sm:w-56 h-[2px] bg-white/10 overflow-hidden rounded-full">
        <div
          className="h-full bg-gradient-to-r from-yellow-700 via-amber-400 to-yellow-200 transition-all duration-300 ease-out"
          style={{ width: `${Math.round(progress)}%` }}
        />
      </div>
    </div>
  );
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState(1);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showIntroText, setShowIntroText] = useState(true);
  const [showScrollPrompt, setShowScrollPrompt] = useState(false);

  // Intro text timing (7.4s)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntroText(false);
      setShowScrollPrompt(true);
    }, 7400);
    return () => clearTimeout(timer);
  }, []);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);
  const audioStartedRef = useRef(false);
  isMutedRef.current = isMuted;

  const wasAutoPausedRef = useRef(false);
  const userMutedRef = useRef(false);

  // Visibility change handling for Chrome/browser tab switching and closing
  useEffect(() => {
    const handleVisibilityChange = () => {
      const audio = audioRef.current;
      if (!audio) return;

      if (document.hidden) {
        if (!audio.paused && !isMutedRef.current && !userMutedRef.current) {
          audio.pause();
          wasAutoPausedRef.current = true;
        }
      } else {
        if (wasAutoPausedRef.current && !userMutedRef.current && !isMutedRef.current) {
          audio.play().then(() => {
            setIsPlaying(true);
            wasAutoPausedRef.current = false;
          }).catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const currentScreenRef = useRef(1);
  const scrollProgressRef = useRef(0);
  currentScreenRef.current = currentScreen;
  scrollProgressRef.current = scrollProgress;

  const isTransitioningRef = useRef(false);
  const isDoorAnimatingRef = useRef(false);
  const doorAnimFrameRef = useRef<number | null>(null);
  const touchStartYRef = useRef(0);

  // Audio Playback
  const startAudio = () => {
    if (isMutedRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = false;
    audio.volume = 0.85;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          audioStartedRef.current = true;
          userMutedRef.current = false;
        })
        .catch(() => {
          audio.muted = true;
          audio.play().catch(() => {});
        });
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = false;
    audio.volume = 0.85;

    const tryPlay = () => {
      if (isMutedRef.current || audioStartedRef.current || userMutedRef.current) return;
      const el = audioRef.current;
      if (!el) return;
      el.muted = false;
      el.volume = 0.85;
      const p = el.play();
      if (p !== undefined) {
        p.then(() => {
          setIsPlaying(true);
          audioStartedRef.current = true;
          cleanupListeners();
        }).catch(() => {
          el.muted = true;
          el.play().catch(() => {});
        });
      }
    };

    tryPlay();

    const interactionEvents = [
      'click',
      'pointerdown',
      'pointerup',
      'mousedown',
      'mouseup',
      'touchstart',
      'touchend',
      'wheel',
      'keydown',
    ];

    const handleInteraction = () => {
      tryPlay();
    };

    const cleanupListeners = () => {
      interactionEvents.forEach((evt) => {
        window.removeEventListener(evt, handleInteraction, true);
      });
    };

    interactionEvents.forEach((evt) => {
      window.addEventListener(evt, handleInteraction, { capture: true, passive: true });
    });

    return () => {
      cleanupListeners();
    };
  }, []);

  const handleToggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted || !isPlaying) {
      setIsMuted(false);
      isMutedRef.current = false;
      userMutedRef.current = false;
      wasAutoPausedRef.current = false;
      audio.muted = false;
      audio.volume = 0.85;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          audioStartedRef.current = true;
        })
        .catch(() => {});
    } else {
      setIsMuted(true);
      isMutedRef.current = true;
      userMutedRef.current = true;
      wasAutoPausedRef.current = false;
      audio.pause();
      setIsPlaying(false);
    }
  };

  const triggerDoorOpeningSequence = () => {
    if (isDoorAnimatingRef.current || currentScreenRef.current !== 1) return;
    isDoorAnimatingRef.current = true;
    startAudio();

    if (doorAnimFrameRef.current) {
      cancelAnimationFrame(doorAnimFrameRef.current);
    }

    const startProg = scrollProgressRef.current;
    const startTime = performance.now();
    const duration = 2800;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const rawT = Math.min(1, elapsed / duration);
      const easedT = rawT < 0.5 ? 4 * rawT * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 3) / 2;

      const currentProg = THREE.MathUtils.lerp(startProg, 1, easedT);
      scrollProgressRef.current = currentProg;
      setScrollProgress(currentProg);

      if (rawT < 1) {
        doorAnimFrameRef.current = requestAnimationFrame(animate);
      } else {
        scrollProgressRef.current = 1;
        setScrollProgress(1);
        currentScreenRef.current = 2;
        setCurrentScreen(2);
        isDoorAnimatingRef.current = false;
      }
    };

    doorAnimFrameRef.current = requestAnimationFrame(animate);
  };

  const triggerDoorClosingSequence = () => {
    if (isDoorAnimatingRef.current) return;
    isDoorAnimatingRef.current = true;
    currentScreenRef.current = 1;
    setCurrentScreen(1);

    if (doorAnimFrameRef.current) {
      cancelAnimationFrame(doorAnimFrameRef.current);
    }

    const startProg = scrollProgressRef.current;
    const startTime = performance.now();
    const duration = 1800;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const rawT = Math.min(1, elapsed / duration);
      const easedT = 1 - (rawT < 0.5 ? 4 * rawT * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 3) / 2);

      const currentProg = THREE.MathUtils.lerp(0, startProg, easedT);
      scrollProgressRef.current = currentProg;
      setScrollProgress(currentProg);

      if (rawT < 1) {
        doorAnimFrameRef.current = requestAnimationFrame(animate);
      } else {
        scrollProgressRef.current = 0;
        setScrollProgress(0);
        isDoorAnimatingRef.current = false;
      }
    };

    doorAnimFrameRef.current = requestAnimationFrame(animate);
  };

  const goToScreen = (targetScreen: number) => {
    if (isTransitioningRef.current || isDoorAnimatingRef.current) return;
    const clamped = Math.max(1, Math.min(targetScreen, 5));
    if (clamped === currentScreenRef.current) return;

    if (clamped === 1) {
      triggerDoorClosingSequence();
      return;
    }

    if (currentScreenRef.current === 1 && clamped >= 2) {
      triggerDoorOpeningSequence();
      return;
    }

    isTransitioningRef.current = true;
    currentScreenRef.current = clamped;
    setCurrentScreen(clamped);

    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 300);
  };

  // Google Maps Direct URLs
  const rmMahalDirectMap =
    'https://www.google.com/maps/place/RM+Mahal/@9.9159096,78.0960821,17z/data=!3m1!4b1!4m6!3m5!1s0x3b00cf8382cfb0f1:0x50ea67118ea98590!8m2!3d9.9159096!4d78.0960821!16s%2Fg%2F11v9_3c5p5?entry=ttu&g_ep=EgoyMDI2MTEwMy4wIKXMDSoASAFQAw%3D%3D';

  const lathaMahalDirectMap =
    'https://www.google.com/maps/place/Latha+Mahal+A%2FC/@10.036713,78.3305832,17z/data=!3m1!4b1!4m6!3m5!1s0x3b00eb0056b49fff:0x9c609628b89bc801!8m2!3d10.036713!4d78.3305832!16s%2Fg%2F11y35mlgjw?entry=ttu&g_ep=EgoyMDI2MTEwMy4wIKXMDSoASAFQAw%3D%3D';

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 1.5) return;
      if (!audioStartedRef.current && !isMutedRef.current && !userMutedRef.current) startAudio();

      const screen = currentScreenRef.current;

      // Screen 1: ONE SINGLE SCROLL triggers smooth cinematic door opening & entry
      if (screen === 1) {
        if (e.deltaY > 0) {
          triggerDoorOpeningSequence();
        }
        return;
      }

      if (isTransitioningRef.current || isDoorAnimatingRef.current) return;

      if (screen === 2) {
        if (e.deltaY > 0) {
          goToScreen(3);
        } else if (e.deltaY < 0) {
          triggerDoorClosingSequence();
        }
        return;
      }

      if (screen >= 3) {
        if (e.deltaY > 0) {
          goToScreen(screen + 1);
        } else if (e.deltaY < 0) {
          goToScreen(screen - 1);
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY;
      if (!audioStartedRef.current && !isMutedRef.current && !userMutedRef.current) startAudio();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!audioStartedRef.current && !isMutedRef.current && !userMutedRef.current) startAudio();

      const screen = currentScreenRef.current;
      const endY = e.changedTouches[0].clientY;
      const deltaY = touchStartYRef.current - endY;

      if (Math.abs(deltaY) < 15) return;

      if (screen === 1) {
        if (deltaY > 0) {
          triggerDoorOpeningSequence();
        }
        return;
      }

      if (isTransitioningRef.current || isDoorAnimatingRef.current) return;

      if (screen === 2) {
        if (deltaY > 0) {
          goToScreen(3);
        } else {
          triggerDoorClosingSequence();
        }
      } else if (screen >= 3) {
        if (deltaY > 0) {
          goToScreen(screen + 1);
        } else {
          goToScreen(screen - 1);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const screen = currentScreenRef.current;
      if (!audioStartedRef.current && !isMutedRef.current && !userMutedRef.current) startAudio();

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        if (screen === 1) {
          triggerDoorOpeningSequence();
        } else {
          goToScreen(screen + 1);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        if (screen === 1) {
          // top
        } else if (screen === 2) {
          triggerDoorClosingSequence();
        } else {
          goToScreen(screen - 1);
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      if (doorAnimFrameRef.current) {
        cancelAnimationFrame(doorAnimFrameRef.current);
      }
    };
  }, []);

  const screenTitles = [
    'The Grand Entrance',
    'Ceremonial Sanctum',
    'Royal Invitation',
    'Engagement Ceremony',
    'Wedding Ceremony',
  ];

  const isDoorsScreen = currentScreen === 1;

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-[#080506] select-none text-white font-serif touch-none overscroll-none">
      <LoadingOverlay />

      {/* Background Ceremonial Shehnai & Nadaswaram Music */}
      <audio
        ref={audioRef}
        autoPlay
        playsInline
        loop
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source src="/assets/music.mp3" type="audio/mpeg" />
        <source src="/assets/engement.mpeg" type="audio/mpeg" />
      </audio>

      {/* Floating Audio Controller */}
      <button
        onClick={handleToggleAudio}
        aria-label={isMuted ? 'Unmute Music' : 'Mute Music'}
        className="fixed top-4 right-4 sm:top-5 sm:right-6 z-40 px-3.5 py-1.5 rounded-full bg-black/80 border border-[#d4af37]/40 shadow-[0_4px_20px_rgba(0,0,0,0.8)] flex items-center gap-2.5 transition-all duration-300 hover:scale-105 active:scale-95 group cursor-pointer"
      >
        {isMuted ? (
          <>
            <svg
              className="w-3.5 h-3.5 text-white/50 group-hover:text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
            <span className="text-[11px] uppercase tracking-widest font-sans font-medium text-white/50 group-hover:text-white">
              Muted
            </span>
          </>
        ) : isPlaying ? (
          <>
            <div className="flex items-end gap-[3px] h-3.5">
              <span className="w-[3px] bg-[#fbbf24] rounded-full animate-[musicBar1_1s_ease-in-out_infinite]" />
              <span className="w-[3px] bg-[#fbbf24] rounded-full animate-[musicBar2_0.8s_ease-in-out_infinite]" />
              <span className="w-[3px] bg-[#fbbf24] rounded-full animate-[musicBar3_1.2s_ease-in-out_infinite]" />
            </div>
            <span className="text-[11px] uppercase tracking-widest font-sans font-medium text-[#fbbf24]">
              Music
            </span>
          </>
        ) : (
          <>
            <svg
              className="w-3.5 h-3.5 text-[#fbbf24] group-hover:scale-110 transition-transform duration-200"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
            <span className="text-[11px] uppercase tracking-widest font-sans font-medium text-[#fbbf24]">
              Music
            </span>
          </>
        )}
      </button>

      {/* Screen 1 & Screen 2: 3D Grand Entrance & Ceremonial Sanctum */}
      <div
        className={`fixed inset-0 w-full h-full bg-[#080506] transition-opacity duration-1000 ease-in-out ${
          currentScreen <= 2
            ? 'opacity-100 z-10 pointer-events-auto'
            : 'opacity-0 z-0 pointer-events-none'
        }`}
      >
        <Scene3D scrollProgress={scrollProgress} />

        {/* Intro Text: "The Beginning of Forever" */}
        {showIntroText && (
          <div
            className={`absolute inset-0 z-20 flex flex-col items-center justify-end pb-12 sm:pb-16 md:pb-20 pointer-events-none transition-opacity duration-700 ${
              scrollProgress > 0.05 || currentScreen > 1 ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <div className="animate-intro-text flex flex-col items-center text-center px-6">
              <img
                src="/assets/logo-transparent.png"
                alt="Monogram"
                className="w-12 sm:w-16 md:w-20 h-auto object-contain mb-1.5 sm:mb-2 translate-y-1 sm:translate-y-1.5 drop-shadow-[0_4px_16px_rgba(212,175,55,0.7)] pointer-events-none"
              />
              <h1 className="font-['Outfit',sans-serif] text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[0.05em] text-gold-shimmer drop-shadow-[0_6px_32px_rgba(212,175,55,0.85)] leading-tight">
                The Beginning of Forever
              </h1>
              <div className="mt-3 sm:mt-4 flex items-center justify-center gap-3">
                <span className="w-14 sm:w-24 h-[1px] bg-gradient-to-r from-transparent via-[#fbbf24] to-[#d4af37]" />
                <span className="text-[#fbbf24] text-xs sm:text-sm opacity-90">✦</span>
                <span className="w-14 sm:w-24 h-[1px] bg-gradient-to-l from-transparent via-[#fbbf24] to-[#d4af37]" />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Screen 3: Invitation Page */}
      <div
        className={`fixed inset-0 w-full h-full bg-[#080506] transition-opacity duration-[3000ms] ease-in-out ${
          currentScreen === 3 ? 'opacity-100 z-20 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
        }`}
      >
        <div className="relative w-full h-full flex items-center justify-center bg-[#080506]">
          <img
            src="/assets/screen3.png"
            alt="A Beautiful Beginning"
            className="event-card-img"
          />
        </div>
      </div>

      {/* Screen 4: Engagement Ceremony Page */}
      <div
        className={`fixed inset-0 w-full h-full bg-[#080506] transition-opacity duration-[3000ms] ease-in-out ${
          currentScreen === 4 ? 'opacity-100 z-20 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
        }`}
      >
        <div className="relative w-full h-full flex items-center justify-center bg-[#080506]">
          <img
            src="/assets/screen4.png"
            alt="Engagement Ceremony - RM Mahal"
            className="event-card-img"
          />
          {currentScreen === 4 && (
            <>
              <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/20 to-transparent animate-[goldVeilSweep_2.2s_cubic-bezier(0.16,1,0.3,1)_forwards]" />
              </div>
              <a
                href={rmMahalDirectMap}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(rmMahalDirectMap, '_blank', 'noopener,noreferrer');
                }}
                aria-label="View RM Mahal on Google Maps"
                title="Open RM Mahal in Google Maps"
                className="absolute left-1/2 -translate-x-1/2 top-[65.56%] -translate-y-1/2 w-[min(32.42vh,86vw)] h-[5.34vh] rounded-full z-30 cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] border border-transparent hover:border-[#fbbf24]/50 hover:bg-[#fbbf24]/10 hover:shadow-[0_0_24px_rgba(251,191,36,0.5)] group pointer-events-auto"
              >
                <span className="sr-only">View on Google Maps</span>
              </a>
            </>
          )}
        </div>
      </div>

      {/* Screen 5: Wedding Ceremony Page */}
      <div
        className={`fixed inset-0 w-full h-full bg-[#080506] transition-opacity duration-[3000ms] ease-in-out ${
          currentScreen === 5 ? 'opacity-100 z-20 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
        }`}
      >
        <div className="relative w-full h-full flex items-center justify-center bg-[#080506]">
          <img
            src="/assets/screen5.png"
            alt="Wedding Ceremony - Latha Mahal"
            className="event-card-img"
          />
          {currentScreen === 5 && (
            <>
              <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/20 to-transparent animate-[goldVeilSweep_2.2s_cubic-bezier(0.16,1,0.3,1)_forwards]" />
              </div>
              <a
                href={lathaMahalDirectMap}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(lathaMahalDirectMap, '_blank', 'noopener,noreferrer');
                }}
                aria-label="View Latha Mahal on Google Maps"
                title="Open Latha Mahal in Google Maps"
                className="absolute left-1/2 -translate-x-1/2 top-[65.56%] -translate-y-1/2 w-[min(32.42vh,86vw)] h-[5.34vh] rounded-full z-30 cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] border border-transparent hover:border-[#fbbf24]/50 hover:bg-[#fbbf24]/10 hover:shadow-[0_0_24px_rgba(251,191,36,0.5)] group pointer-events-auto"
              >
                <span className="sr-only">View on Google Maps</span>
              </a>
            </>
          )}
        </div>
      </div>

      {/* Scroll Up bouncing prompt: persistent on all screens */}
      {showScrollPrompt && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center pb-6 sm:pb-8 pointer-events-none animate-[fadeIn_0.8s_ease-out_forwards]">
          <div
            onClick={() => goToScreen(currentScreen + 1)}
            className="flex flex-col items-center gap-2 text-center group cursor-pointer pointer-events-auto"
          >
            <div className="animate-bounce flex flex-col items-center text-[#fbbf24] group-hover:scale-110 transition-transform">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-[0_2px_8px_rgba(251,191,36,0.85)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </div>
            <span className="font-['Outfit',sans-serif] text-sm sm:text-base tracking-[0.25em] uppercase font-medium text-gold-shimmer drop-shadow-[0_2px_12px_rgba(212,175,55,0.85)]">
              Scroll Up
            </span>
            <span className="w-12 h-[1px] bg-gradient-to-r from-transparent via-[#fbbf24]/60 to-transparent" />
          </div>
        </div>
      )}

      {/* Floating Right Pagination Dots (1 to 5) */}
      <div className="fixed right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-3 pointer-events-auto">
        {[1, 2, 3, 4, 5].map((screenNum) => {
          const isActive = screenNum === currentScreen;
          return (
            <button
              key={screenNum}
              onClick={() => goToScreen(screenNum)}
              aria-label={`Go to screen ${screenNum}: ${screenTitles[screenNum - 1]}`}
              title={screenTitles[screenNum - 1]}
              className={`p-1 transition-all duration-300 cursor-pointer ${
                isActive ? 'scale-125' : 'scale-100 hover:scale-110'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-[#fbbf24] shadow-[0_0_10px_#fbbf24]'
                    : 'bg-white/30 hover:bg-white/60'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
