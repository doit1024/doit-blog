import { useEffect, useMemo, type ReactNode } from "react";
import { CanvasTexture, RepeatWrapping } from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { Vector3Tuple } from "@/data/gear";

function Block({
  position,
  size,
  color,
  radius = 0.008,
  rotation = [0, 0, 0],
  children,
}: {
  position: Vector3Tuple;
  size: Vector3Tuple;
  color: string;
  radius?: number;
  rotation?: Vector3Tuple;
  children?: ReactNode;
}) {
  const geometry = useMemo(
    () =>
      new RoundedBoxGeometry(
        ...size,
        2,
        Math.min(radius, ...size.map(n => n / 3))
      ),
    [size[0], size[1], size[2], radius]
  );
  return (
    <mesh
      position={position}
      rotation={rotation}
      geometry={geometry}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={color} roughness={0.7} />
      {children}
    </mesh>
  );
}

export default function StudyRoom({ dark }: { dark: boolean }) {
  const wood = dark ? "#6c4e37" : "#ab8058";
  const wall = dark ? "#575b51" : "#dcd8c9";
  const cream = dark ? "#8f8b76" : "#f2e9d5";
  const grain = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#cba678";
    context.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 2) {
      context.strokeStyle = `rgba(90,55,25,${0.025 + (Math.sin(y * 1.73) + 1) * 0.025})`;
      context.beginPath();
      context.moveTo(0, y);
      context.bezierCurveTo(80, y + Math.sin(y) * 4, 180, y - 4, 256, y);
      context.stroke();
    }
    const texture = new CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }, []);
  useEffect(() => () => grain.dispose(), [grain]);

  return (
    <group position={[0, -0.65, 0]}>
      <Block
        position={[0, -0.09, 0]}
        size={[2.65, 0.18, 2.05]}
        color={wood}
        radius={0.035}
      />
      {Array.from({ length: 9 }, (_, i) => (
        <Block
          key={i}
          position={[0, 0.012, -0.91 + i * 0.228]}
          size={[2.61, 0.035, 0.221]}
          color={i % 3 === 0 ? "#a78865" : "#b79a76"}
          radius={0.002}
        />
      ))}
      <Block position={[0, 0.93, -1]} size={[2.65, 1.86, 0.08]} color={wall} />
      <Block
        position={[-1.28, 0.93, 0]}
        size={[0.08, 1.86, 2.05]}
        color={wall}
      />
      <Block
        position={[0, 0.06, -0.945]}
        size={[2.55, 0.1, 0.04]}
        color={cream}
        radius={0.003}
      />
      <Block
        position={[-1.23, 0.06, 0]}
        size={[0.04, 0.1, 1.96]}
        color={cream}
        radius={0.003}
      />
      {/* Recessed window and warm daylight. */}
      <Block
        position={[-0.65, 1.24, -0.936]}
        size={[0.79, 1.0, 0.045]}
        color={wood}
      />
      <mesh position={[-0.65, 1.24, -0.906]}>
        <planeGeometry args={[0.7, 0.9]} />
        <meshStandardMaterial
          color={dark ? "#657684" : "#d6e5df"}
          emissive={dark ? "#293c4c" : "#b5c8ba"}
          emissiveIntensity={0.35}
        />
      </mesh>
      <Block
        position={[-0.65, 1.24, -0.872]}
        size={[0.027, 0.9, 0.04]}
        color={cream}
        radius={0.002}
      />
      <Block
        position={[-0.65, 1.28, -0.872]}
        size={[0.74, 0.024, 0.04]}
        color={cream}
        radius={0.002}
      />
      <Block
        position={[-0.65, 0.75, -0.85]}
        size={[0.87, 0.055, 0.2]}
        color={cream}
      />
      {/* Bookshelf with individually arranged spines. */}
      <Block
        position={[0.84, 0.73, -0.79]}
        size={[0.56, 1.45, 0.32]}
        color={wood}
      />
      <Block
        position={[0.84, 0.77, -0.61]}
        size={[0.47, 1.26, 0.055]}
        color={dark ? "#403b31" : "#826849"}
      />
      {[0.16, 0.58, 1, 1.4].map(y => (
        <Block
          key={y}
          position={[0.84, y, -0.59]}
          size={[0.53, 0.04, 0.33]}
          color={wood}
        />
      ))}
      {[0.18, 0.6, 1.02].map((y, row) =>
        Array.from({ length: 6 }, (_, i) => (
          <Block
            key={`${row}-${i}`}
            position={[0.65 + i * 0.07, y + 0.135, -0.55]}
            size={[0.045, 0.24 + (i % 3) * 0.032, 0.16]}
            rotation={[0, 0, i === 5 ? -0.14 : 0]}
            color={
              [
                "#c4b699",
                "#67715e",
                "#a06e55",
                "#ded5bb",
                "#454c48",
                "#b69463",
              ][(i + row) % 6]
            }
            radius={0.002}
          />
        ))
      )}
      {/* Desk, rounded front edge, legs and desk mat. */}
      <mesh position={[0, 0.77, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.75, 0.07, 0.82]} />
        <meshStandardMaterial color={wood} map={grain} roughness={0.66} />
      </mesh>
      {[-0.76, 0.76].flatMap(x =>
        [-0.32, 0.32].map(z => (
          <Block
            key={`${x}-${z}`}
            position={[x, 0.38, z]}
            size={[0.055, 0.74, 0.055]}
            color={wood}
          />
        ))
      )}
      <Block
        position={[0, 0.815, 0.025]}
        size={[0.9, 0.008, 0.55]}
        color={dark ? "#55594d" : "#797e67"}
        radius={0.01}
      />
      <Block
        position={[0.43, 0.82, 0.17]}
        size={[0.22, 0.018, 0.19]}
        color={cream}
        radius={0.018}
      />
      <Block
        position={[-0.52, 0.817, -0.13]}
        size={[0.11, 0.015, 0.11]}
        color="#686963"
      />
      <Block
        position={[-0.52, 0.86, -0.155]}
        size={[0.07, 0.09, 0.009]}
        rotation={[-0.2, 0, 0]}
        color="#686963"
      />
      {/* Desk lamp. */}
      <mesh position={[-0.71, 0.82, -0.24]} castShadow>
        <cylinderGeometry args={[0.09, 0.095, 0.025, 40]} />
        <meshStandardMaterial color={cream} roughness={0.42} />
      </mesh>
      <Block
        position={[-0.71, 1.02, -0.24]}
        size={[0.015, 0.38, 0.015]}
        color="#6f6d5d"
      />
      <mesh position={[-0.71, 1.24, -0.24]} castShadow>
        <coneGeometry args={[0.16, 0.14, 48, 1, true]} />
        <meshStandardMaterial color={cream} roughness={0.55} side={2} />
      </mesh>
      <pointLight
        position={[-0.71, 1.17, -0.24]}
        color="#ffca87"
        intensity={dark ? 1 : 0.35}
        distance={1.5}
        decay={2}
      />
      {/* Chair tucked in; no invented equipment on the desk. */}
      <Block
        position={[0, 0.47, 0.7]}
        size={[0.42, 0.09, 0.38]}
        color="#777864"
        radius={0.035}
      />
      <Block
        position={[0, 0.79, 0.9]}
        size={[0.42, 0.42, 0.075]}
        rotation={[-0.1, 0, 0]}
        color="#777864"
        radius={0.045}
      />
      {[-0.15, 0.15].flatMap(x =>
        [0.56, 0.83].map(z => (
          <Block
            key={`${x}-${z}`}
            position={[x, 0.24, z]}
            size={[0.035, 0.45, 0.035]}
            color={wood}
          />
        ))
      )}
      {/* Plant beside the window. */}
      <mesh position={[-1.08, 0.21, -0.63]} castShadow>
        <cylinderGeometry args={[0.12, 0.09, 0.29, 32]} />
        <meshStandardMaterial color="#aa7354" roughness={0.9} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => (
        <group
          key={i}
          position={[-1.08, 0.38, -0.63]}
          rotation={[0, (i * Math.PI * 2) / 7, 0.1]}
        >
          <mesh
            position={[0, 0.19, 0.08]}
            rotation={[0.45, 0, 0]}
            scale={[0.047, 0.24, 0.018]}
            castShadow
          >
            <sphereGeometry args={[1, 12, 12]} />
            <meshStandardMaterial
              color={i % 2 ? "#65724d" : "#4f6243"}
              roughness={0.8}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
