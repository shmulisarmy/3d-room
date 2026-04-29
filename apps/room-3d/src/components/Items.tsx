import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { memo, useRef } from "react";
import { BufferGeometry, DoubleSide, Mesh, MeshBasicMaterial } from "three";
import type { ProductPalette, ProductSize, RoomItem } from "@/lib/items";

interface ItemMeshProps {
  item: RoomItem;
  highlighted: boolean;
  selected: boolean;
  detail: ProductDetailLevel;
  onSelect: (item: RoomItem) => void;
  onHover: (item: RoomItem | null) => void;
}

interface ProductProps {
  item: RoomItem;
}

export type ProductDetailLevel = "simple" | "detailed";

interface LabelPanelProps {
  color: string;
  width: number;
  height: number;
  z: number;
  x?: number;
  y?: number;
}

const LabelPanel = ({ color, width, height, z, x = 0, y = 0 }: LabelPanelProps) => (
  <mesh position={[x, y, z]}>
    <planeGeometry args={[width, height]} />
    <meshBasicMaterial color={color} side={DoubleSide} />
  </mesh>
);

const ShelfTag = ({ palette, size }: { palette: ProductPalette; size: ProductSize }) => (
  <>
    <LabelPanel color={palette.label} width={size.width * 0.72} height={size.height * 0.42} z={-size.depth / 2 - 0.004} />
    <LabelPanel color={palette.secondary} width={size.width * 0.62} height={size.height * 0.12} y={size.height * 0.23} z={-size.depth / 2 - 0.005} />
    <LabelPanel color={palette.accent} width={size.width * 0.46} height={size.height * 0.1} y={-size.height * 0.22} z={-size.depth / 2 - 0.006} />
    <LabelPanel color={palette.cap} width={size.width * 0.12} height={size.height * 0.08} x={-size.width * 0.2} y={-size.height * 0.02} z={-size.depth / 2 - 0.007} />
    <LabelPanel color={palette.accent} width={size.width * 0.12} height={size.height * 0.08} x={size.width * 0.2} y={-size.height * 0.02} z={-size.depth / 2 - 0.007} />
  </>
);

const SimpleProductGeometry = ({ item }: ProductProps) => {
  const { width, height, depth } = item.size;
  const palette = item.palette;
  const isRoundProduct = ["coffeeTin", "cannedBeans", "can", "salsaJar", "honeyJar", "jamJar", "jar"].includes(item.kind);
  const isFruit = item.kind === "apple";

  if (isFruit) {
    return (
      <mesh scale={[width * 0.48, height * 0.42, width * 0.48]}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshLambertMaterial color={palette.primary} />
      </mesh>
    );
  }

  return (
    <>
      <mesh>
        {isRoundProduct ? <cylinderGeometry args={[width / 2, width / 2, height, 10]} /> : <boxGeometry args={[width, height, depth]} />}
        <meshLambertMaterial color={palette.primary} />
      </mesh>
      <LabelPanel color={palette.label} width={width * 0.58} height={height * 0.28} z={-depth / 2 - 0.003} />
    </>
  );
};

const BoxProduct = ({ item }: ProductProps) => {
  const { width, height, depth } = item.size;
  const palette = item.palette;

  return (
    <>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={palette.primary} roughness={0.72} />
      </mesh>
      <mesh position={[-width * 0.43, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.08, height * 0.96, depth * 1.03]} />
        <meshStandardMaterial color={palette.secondary} roughness={0.7} />
      </mesh>
      <mesh position={[0, height * 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.96, height * 0.06, depth * 1.04]} />
        <meshStandardMaterial color={palette.cap} roughness={0.65} />
      </mesh>
      <ShelfTag palette={palette} size={item.size} />
    </>
  );
};

const BagProduct = ({ item }: ProductProps) => {
  const { width, height, depth } = item.size;
  const palette = item.palette;

  return (
    <>
      <mesh position={[0, -height * 0.01, 0]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.9, height * 0.9, depth]} />
        <meshStandardMaterial color={palette.primary} roughness={0.9} metalness={0.08} />
      </mesh>
      <mesh position={[0, height * 0.44, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height * 0.1, depth * 0.72]} />
        <meshStandardMaterial color={palette.secondary} roughness={0.88} />
      </mesh>
      <mesh position={[0, -height * 0.44, 0]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.96, height * 0.09, depth * 0.82]} />
        <meshStandardMaterial color={palette.accent} roughness={0.85} />
      </mesh>
      <mesh position={[-width * 0.49, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.08, height * 0.74, depth * 0.95]} />
        <meshStandardMaterial color={palette.secondary} roughness={0.9} />
      </mesh>
      <mesh position={[width * 0.49, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.08, height * 0.74, depth * 0.95]} />
        <meshStandardMaterial color={palette.secondary} roughness={0.9} />
      </mesh>
      <LabelPanel color={palette.label} width={width * 0.58} height={height * 0.42} z={-depth / 2 - 0.004} />
      <LabelPanel color={palette.accent} width={width * 0.34} height={height * 0.11} y={height * 0.11} z={-depth / 2 - 0.005} />
      <LabelPanel color={palette.secondary} width={width * 0.16} height={height * 0.12} x={-width * 0.17} y={-height * 0.09} z={-depth / 2 - 0.006} />
      <LabelPanel color={palette.cap} width={width * 0.16} height={height * 0.12} x={width * 0.17} y={-height * 0.09} z={-depth / 2 - 0.006} />
    </>
  );
};

const CanProduct = ({ item }: ProductProps) => {
  const { width, height } = item.size;
  const palette = item.palette;
  const radius = width / 2;

  return (
    <>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, height, 20]} />
        <meshStandardMaterial color={palette.primary} roughness={0.45} metalness={0.35} />
      </mesh>
      <mesh position={[0, height * 0.42, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 1.02, radius * 1.02, height * 0.09, 20]} />
        <meshStandardMaterial color={palette.cap} roughness={0.32} metalness={0.55} />
      </mesh>
      <mesh position={[0, -height * 0.42, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 1.01, radius * 1.01, height * 0.08, 20]} />
        <meshStandardMaterial color={palette.cap} roughness={0.36} metalness={0.5} />
      </mesh>
      <LabelPanel color={palette.label} width={width * 0.92} height={height * 0.46} z={-radius - 0.004} />
      <LabelPanel color={palette.secondary} width={width * 0.76} height={height * 0.13} y={height * 0.15} z={-radius - 0.005} />
      <LabelPanel color={palette.accent} width={width * 0.34} height={height * 0.13} y={-height * 0.1} z={-radius - 0.006} />
    </>
  );
};

const JarProduct = ({ item }: ProductProps) => {
  const { width, height } = item.size;
  const palette = item.palette;
  const radius = width / 2;

  return (
    <>
      <mesh position={[0, -height * 0.03, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 0.94, radius * 0.98, height * 0.72, 20]} />
        <meshStandardMaterial color={palette.primary} transparent opacity={0.78} roughness={0.28} metalness={0.05} />
      </mesh>
      <mesh position={[0, height * 0.38, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 0.98, radius * 0.98, height * 0.16, 20]} />
        <meshStandardMaterial color={palette.cap} roughness={0.42} metalness={0.32} />
      </mesh>
      <mesh position={[0, -height * 0.36, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, height * 0.08, 20]} />
        <meshStandardMaterial color={palette.secondary} roughness={0.62} />
      </mesh>
      <LabelPanel color={palette.label} width={width * 0.84} height={height * 0.34} z={-radius - 0.004} />
      <LabelPanel color={palette.accent} width={width * 0.42} height={height * 0.1} y={height * 0.04} z={-radius - 0.005} />
      <LabelPanel color={palette.secondary} width={width * 0.56} height={height * 0.08} y={-height * 0.09} z={-radius - 0.006} />
    </>
  );
};

const BottleProduct = ({ item }: ProductProps) => {
  const { width, height } = item.size;
  const palette = item.palette;
  const radius = width / 2;
  const bodyHeight = height * 0.56;
  const shoulderHeight = height * 0.14;
  const neckHeight = height * 0.18;
  const capHeight = height * 0.09;
  const bodyY = -height / 2 + bodyHeight / 2;
  const shoulderY = -height / 2 + bodyHeight + shoulderHeight / 2;
  const neckY = -height / 2 + bodyHeight + shoulderHeight + neckHeight / 2;

  return (
    <>
      <mesh position={[0, bodyY, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 0.95, radius, bodyHeight, 18]} />
        <meshStandardMaterial color={palette.primary} roughness={0.36} metalness={0.08} />
      </mesh>
      <mesh position={[0, shoulderY, 0]} castShadow receiveShadow>
        <coneGeometry args={[radius * 0.96, shoulderHeight, 18]} />
        <meshStandardMaterial color={palette.primary} roughness={0.38} metalness={0.08} />
      </mesh>
      <mesh position={[0, neckY, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 0.38, radius * 0.42, neckHeight, 18]} />
        <meshStandardMaterial color={palette.primary} roughness={0.32} metalness={0.1} />
      </mesh>
      <mesh position={[0, height / 2 - capHeight / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 0.46, radius * 0.46, capHeight, 18]} />
        <meshStandardMaterial color={palette.cap} roughness={0.34} metalness={0.45} />
      </mesh>
      <LabelPanel color={palette.label} width={width * 0.82} height={height * 0.28} y={-height * 0.13} z={-radius - 0.004} />
      <LabelPanel color={palette.secondary} width={width * 0.56} height={height * 0.09} y={height * 0.02} z={-radius - 0.005} />
      <LabelPanel color={palette.accent} width={width * 0.44} height={height * 0.08} y={-height * 0.25} z={-radius - 0.006} />
    </>
  );
};

const MustardProduct = ({ item }: ProductProps) => {
  const { width, height } = item.size;
  const palette = item.palette;
  const radius = width / 2;

  return (
    <>
      <mesh position={[0, -height * 0.06, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 0.72, radius, height * 0.72, 18]} />
        <meshStandardMaterial color={palette.primary} roughness={0.62} />
      </mesh>
      <mesh position={[0, height * 0.34, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 0.6, radius * 0.68, height * 0.12, 18]} />
        <meshStandardMaterial color={palette.cap} roughness={0.56} />
      </mesh>
      <mesh position={[0, height * 0.47, 0]} castShadow receiveShadow>
        <coneGeometry args={[radius * 0.34, height * 0.12, 18]} />
        <meshStandardMaterial color={palette.cap} roughness={0.55} />
      </mesh>
      <LabelPanel color={palette.label} width={width * 0.88} height={height * 0.28} y={-height * 0.1} z={-radius - 0.004} />
      <LabelPanel color={palette.secondary} width={width * 0.54} height={height * 0.08} y={height * 0.04} z={-radius - 0.005} />
    </>
  );
};

const CartonProduct = ({ item }: ProductProps) => {
  const { width, height, depth } = item.size;
  const palette = item.palette;
  const bodyHeight = height * 0.78;

  return (
    <>
      <mesh position={[0, -height / 2 + bodyHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, bodyHeight, depth]} />
        <meshStandardMaterial color={palette.primary} roughness={0.66} />
      </mesh>
      <mesh position={[0, height * 0.36, -depth * 0.18]} rotation={[0.52, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height * 0.08, depth * 0.62]} />
        <meshStandardMaterial color={palette.secondary} roughness={0.68} />
      </mesh>
      <mesh position={[0, height * 0.36, depth * 0.18]} rotation={[-0.52, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height * 0.08, depth * 0.62]} />
        <meshStandardMaterial color={palette.secondary} roughness={0.68} />
      </mesh>
      <mesh position={[width * 0.26, height * 0.46, -depth * 0.1]} castShadow receiveShadow>
        <cylinderGeometry args={[width * 0.08, width * 0.08, height * 0.07, 16]} />
        <meshStandardMaterial color={palette.cap} roughness={0.58} />
      </mesh>
      <ShelfTag palette={palette} size={item.size} />
    </>
  );
};

const JugProduct = ({ item }: ProductProps) => {
  const { width, height, depth } = item.size;
  const palette = item.palette;

  return (
    <>
      <mesh position={[0, -height * 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.82, height * 0.72, depth]} />
        <meshStandardMaterial color={palette.primary} roughness={0.55} />
      </mesh>
      <mesh position={[0, height * 0.33, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[width * 0.16, width * 0.2, height * 0.18, 16]} />
        <meshStandardMaterial color={palette.secondary} roughness={0.52} />
      </mesh>
      <mesh position={[0, height * 0.47, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[width * 0.18, width * 0.18, height * 0.08, 16]} />
        <meshStandardMaterial color={palette.cap} roughness={0.42} />
      </mesh>
      <mesh position={[width * 0.47, height * 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.1, height * 0.44, depth * 0.18]} />
        <meshStandardMaterial color={palette.primary} roughness={0.55} />
      </mesh>
      <mesh position={[width * 0.37, height * 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.26, height * 0.08, depth * 0.16]} />
        <meshStandardMaterial color={palette.primary} roughness={0.55} />
      </mesh>
      <mesh position={[width * 0.37, -height * 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.26, height * 0.08, depth * 0.16]} />
        <meshStandardMaterial color={palette.primary} roughness={0.55} />
      </mesh>
      <LabelPanel color={palette.label} width={width * 0.58} height={height * 0.34} y={-height * 0.11} z={-depth / 2 - 0.004} />
      <LabelPanel color={palette.accent} width={width * 0.36} height={height * 0.1} y={height * 0.03} z={-depth / 2 - 0.005} />
    </>
  );
};

const AppleProduct = ({ item }: ProductProps) => {
  const { width, height } = item.size;
  const palette = item.palette;

  return (
    <>
      <mesh position={[0, -height * 0.05, 0]} scale={[width * 0.48, height * 0.42, width * 0.48]} castShadow receiveShadow>
        <sphereGeometry args={[1, 18, 12]} />
        <meshStandardMaterial color={palette.primary} roughness={0.42} />
      </mesh>
      <mesh position={[0, height * 0.34, 0]} rotation={[0.25, 0, -0.24]} castShadow receiveShadow>
        <cylinderGeometry args={[width * 0.045, width * 0.035, height * 0.2, 10]} />
        <meshStandardMaterial color={palette.cap} roughness={0.7} />
      </mesh>
      <mesh position={[width * 0.12, height * 0.35, 0]} rotation={[0, 0, -0.9]} castShadow receiveShadow>
        <coneGeometry args={[width * 0.08, height * 0.18, 8]} />
        <meshStandardMaterial color={palette.secondary} roughness={0.68} />
      </mesh>
    </>
  );
};

const BreadProduct = ({ item }: ProductProps) => {
  const { width, height, depth } = item.size;
  const palette = item.palette;

  return (
    <>
      <mesh position={[0, -height * 0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height * 0.42, depth]} />
        <meshStandardMaterial color={palette.primary} roughness={0.74} />
      </mesh>
      <mesh position={[0, height * 0.02, 0]} scale={[width * 0.5, height * 0.45, depth * 0.5]} castShadow receiveShadow>
        <sphereGeometry args={[1, 18, 12]} />
        <meshStandardMaterial color={palette.secondary} roughness={0.78} />
      </mesh>
      <LabelPanel color={palette.label} width={width * 0.52} height={height * 0.22} y={-height * 0.14} z={-depth / 2 - 0.004} />
      <LabelPanel color={palette.accent} width={width * 0.32} height={height * 0.08} y={-height * 0.03} z={-depth / 2 - 0.005} />
    </>
  );
};

const ProductGeometry = ({ item, detail = "detailed" }: ProductProps & { detail?: ProductDetailLevel }) => {
  if (detail === "simple") {
    return <SimpleProductGeometry item={item} />;
  }

  switch (item.kind) {
    case "chipsBag":
    case "coffeeBag":
    case "riceBag":
      return <BagProduct item={item} />;
    case "cheeseCurlsBox":
    case "teaBoxGreen":
    case "teaBoxPurple":
    case "cerealBox":
      return <BoxProduct item={item} />;
    case "coffeeTin":
    case "cannedBeans":
    case "can":
      return <CanProduct item={item} />;
    case "salsaJar":
    case "honeyJar":
    case "jamJar":
    case "jar":
      return <JarProduct item={item} />;
    case "hotSauceBottle":
    case "oliveOilBottle":
    case "vinegarBottle":
    case "dressingBottle":
      return <BottleProduct item={item} />;
    case "mustardBottle":
      return <MustardProduct item={item} />;
    case "milkCarton":
    case "juiceCarton":
      return <CartonProduct item={item} />;
    case "mapleSyrupJug":
      return <JugProduct item={item} />;
    case "apple":
      return <AppleProduct item={item} />;
    case "breadLoaf":
      return <BreadProduct item={item} />;
  }
};

export const ProductPreview = ({ item }: ProductProps) => {
  const scale = 1.45 / Math.max(item.size.width, item.size.height, item.size.depth);

  return (
    <group scale={scale} rotation={[0.08, -0.48, 0]} position={[0, 0.02, 0]}>
      <ProductGeometry item={item} />
    </group>
  );
};

const Highlight = ({ item }: { item: RoomItem }) => {
  const ringRef = useRef<Mesh<BufferGeometry, MeshBasicMaterial>>(null);
  const beamRef = useRef<Mesh<BufferGeometry, MeshBasicMaterial>>(null);
  const radius = Math.max(0.18, Math.max(item.size.width, item.size.depth) * 0.72);

  useFrame(({ clock }) => {
    const pulse = 0.5 + Math.sin(clock.elapsedTime * 4.2) * 0.5;

    if (ringRef.current) {
      ringRef.current.scale.setScalar(0.88 + pulse * 0.22);
    }

    if (beamRef.current) {
      beamRef.current.material.opacity = 0.1 + pulse * 0.12;
    }
  });

  return (
    <group position={[0, -item.size.height / 2 + 0.014, 0]}>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 0.72, radius, 40]} />
        <meshBasicMaterial color="#ffd83d" transparent opacity={0.9} side={DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={beamRef} position={[0, 0.58, 0]}>
        <cylinderGeometry args={[radius * 0.5, radius * 0.5, 1.16, 24, 1, true]} />
        <meshBasicMaterial color="#ffe66d" transparent opacity={0.16} side={DoubleSide} depthWrite={false} />
      </mesh>
      <pointLight color="#ffd83d" intensity={0.35} distance={1.2} position={[0, 0.45, 0]} />
    </group>
  );
};

const SelectedMarker = ({ item }: { item: RoomItem }) => {
  const ringRef = useRef<Mesh<BufferGeometry, MeshBasicMaterial>>(null);
  const radius = Math.max(0.2, Math.max(item.size.width, item.size.depth) * 0.82);

  useFrame(({ clock }) => {
    const pulse = 0.5 + Math.sin(clock.elapsedTime * 3.1) * 0.5;

    if (ringRef.current) {
      ringRef.current.scale.setScalar(0.96 + pulse * 0.08);
    }
  });

  return (
    <group position={[0, -item.size.height / 2 + 0.018, 0]}>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 0.78, radius, 48]} />
        <meshBasicMaterial color="#58a6ff" transparent opacity={0.92} side={DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, item.size.height + 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius * 0.2, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.92} side={DoubleSide} depthWrite={false} />
      </mesh>
      <pointLight color="#58a6ff" intensity={0.42} distance={1.4} position={[0, 0.45, 0]} />
    </group>
  );
};

export const ItemMesh = memo(function ItemMesh({ item, highlighted, selected, detail, onSelect, onHover }: ItemMeshProps) {
  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onSelect(item);
  };

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onHover(item);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = () => {
    onHover(null);
    document.body.style.cursor = "";
  };

  return (
    <group
      position={item.position}
      rotation={item.rotation}
      onPointerDown={handlePointerDown}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <ProductGeometry item={item} detail={selected ? "detailed" : detail} />
      {selected ? <SelectedMarker item={item} /> : null}
      {highlighted ? <Highlight item={item} /> : null}
    </group>
  );
});
