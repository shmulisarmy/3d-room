import { Html, OrbitControls, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Circle, CornerDownLeft, Footprints, Globe2, Map, PackageSearch, Search, X, type LucideIcon } from "lucide-react";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentRef, type RefObject } from "react";
import { DoubleSide, Frustum, MathUtils, Matrix4, SRGBColorSpace, Texture, Vector3, type PerspectiveCamera } from "three";
import referenceOne from "@assets/WhatsApp Image 2026-04-27 at 17.57.16.jpeg";
import referenceTwo from "@assets/WhatsApp Image 2026-04-27 at 17.57.17.jpeg";
import referenceThree from "@assets/WhatsApp Image 2026-04-27 at 17.57.17 (1).jpeg";
import { ItemMesh, ProductPreview } from "@/components/Items";
import { Player } from "@/components/Player";
import { buildRoom, ROOM_DIMENSIONS, type RoomItem, type Shelf } from "@/lib/items";

type ViewMode = "top" | "walk" | "orbit";
type OrbitControlsHandle = ComponentRef<typeof OrbitControls>;

interface ModeOption {
  value: ViewMode;
  label: string;
  Icon: LucideIcon;
  instruction: string;
}

const modeOptions: ModeOption[] = [
  {
    value: "top",
    label: "Top",
    Icon: Map,
    instruction: "Scroll to zoom. Rotation is locked."
  },
  {
    value: "walk",
    label: "Walk",
    Icon: Footprints,
    instruction: "Press S to toggle mouse look. W/A/D and arrows move."
  },
  {
    value: "orbit",
    label: "Orbit",
    Icon: Circle,
    instruction: "Drag to orbit. WASD/arrows move through the room."
  }
];

const referencePhotos = [referenceOne, referenceTwo, referenceThree];

const shelfWood = "#5d4028";
const shelfEdge = "#3a2618";
const searchSuggestions = ["chips", "tea", "salsa", "hot sauce", "olive oil", "milk"];
const halfRoomWidth = ROOM_DIMENSIONS.width / 2;
const halfRoomDepth = ROOM_DIMENSIONS.depth / 2;
const floorXSeams = Array.from({ length: 15 }, (_, index) => -halfRoomWidth + 0.3 + index * ((ROOM_DIMENSIONS.width - 0.6) / 14));
const floorZSeams = Array.from({ length: 10 }, (_, index) => -halfRoomDepth + 0.55 + index * ((ROOM_DIMENSIONS.depth - 1.1) / 9));
const sideWallPostPositions = Array.from({ length: 4 }, (_, index) => -halfRoomDepth + 0.9 + index * ((ROOM_DIMENSIONS.depth - 1.8) / 3));

const formatPosition = (item: RoomItem) => item.position.map((value) => value.toFixed(2)).join(", ");

const getInitialSearchQuery = () => {
  if (typeof window === "undefined") {
    return "";
  }

  return new URLSearchParams(window.location.search).get("q")?.slice(0, 80) ?? "";
};

const isTextEntryTarget = (target: EventTarget | null) =>
  target instanceof HTMLInputElement ||
  target instanceof HTMLTextAreaElement ||
  target instanceof HTMLSelectElement ||
  (target instanceof HTMLElement && target.isContentEditable);

const modeShortcuts: Record<string, ViewMode> = {
  "1": "top",
  "2": "walk",
  "3": "orbit"
};

const commandModeShortcuts: Record<string, ViewMode> = {
  t: "top",
  w: "walk",
  o: "orbit"
};

const movementKeyCodes = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

const getTopCameraDistance = (camera: PerspectiveCamera) => {
  const verticalFov = (camera.fov * Math.PI) / 180;
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
  const depthDistance = ROOM_DIMENSIONS.depth / (2 * Math.tan(verticalFov / 2));
  const widthDistance = ROOM_DIMENSIONS.width / (2 * Math.tan(horizontalFov / 2));

  return Math.max(depthDistance, widthDistance) * 1.72;
};

const CameraRig = ({ mode }: { mode: ViewMode }) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    camera.near = 0.08;
    camera.far = 80;

    if (mode === "top") {
      const topCamera = camera as PerspectiveCamera;

      camera.up.set(0, 0, -1);
      camera.position.set(0, getTopCameraDistance(topCamera), 0);
      camera.lookAt(0, 0, 0);
    } else if (mode === "orbit") {
      camera.up.set(0, 1, 0);
      camera.position.set(3.8, 2.65, 3.8);
      camera.lookAt(0, 1.65, 0);
    } else {
      camera.up.set(0, 1, 0);
      camera.position.set(0, 1.6, 2.7);
      camera.lookAt(0, 1.6, -2.5);
    }

    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }, [camera, mode]);

  return null;
};

const RoomShell = ({ showCeiling }: { showCeiling: boolean }) => (
  <group>
    <mesh position={[0, -0.015, 0]} receiveShadow>
      <boxGeometry args={[ROOM_DIMENSIONS.width, 0.03, ROOM_DIMENSIONS.depth]} />
      <meshStandardMaterial color="#7a5a3a" roughness={0.82} />
    </mesh>

    {floorXSeams.map((x) => (
      <mesh key={`floor-plank-x-${x}`} position={[x, 0.003, 0]} receiveShadow>
        <boxGeometry args={[0.018, 0.012, ROOM_DIMENSIONS.depth]} />
        <meshStandardMaterial color="#5d4129" roughness={0.86} />
      </mesh>
    ))}

    {floorZSeams.map((z) => (
      <mesh key={`floor-plank-z-${z}`} position={[0, 0.005, z]} receiveShadow>
        <boxGeometry args={[ROOM_DIMENSIONS.width, 0.01, 0.016]} />
        <meshStandardMaterial color="#8d6a45" roughness={0.82} />
      </mesh>
    ))}

    {showCeiling ? (
      <>
        <mesh position={[0, ROOM_DIMENSIONS.height + 0.015, 0]} receiveShadow>
          <boxGeometry args={[ROOM_DIMENSIONS.width, 0.03, ROOM_DIMENSIONS.depth]} />
          <meshStandardMaterial color="#f6f2ea" roughness={0.76} />
        </mesh>
        {[-2.7, 0, 2.7].map((x) => (
          <mesh key={`light-panel-${x}`} position={[x, ROOM_DIMENSIONS.height - 0.035, -0.4]}>
            <boxGeometry args={[1.6, 0.025, 0.28]} />
            <meshBasicMaterial color="#fff5d8" />
          </mesh>
        ))}
      </>
    ) : null}

    <mesh position={[0, ROOM_DIMENSIONS.height / 2, halfRoomDepth]} receiveShadow>
      <boxGeometry args={[ROOM_DIMENSIONS.width, ROOM_DIMENSIONS.height, 0.08]} />
      <meshStandardMaterial color="#e9e1d2" roughness={0.8} />
    </mesh>
    <mesh position={[0, ROOM_DIMENSIONS.height / 2, -halfRoomDepth]} receiveShadow>
      <boxGeometry args={[ROOM_DIMENSIONS.width, ROOM_DIMENSIONS.height, 0.08]} />
      <meshStandardMaterial color="#e9e1d2" roughness={0.8} />
    </mesh>
    <mesh position={[halfRoomWidth, ROOM_DIMENSIONS.height / 2, 0]} receiveShadow>
      <boxGeometry args={[0.08, ROOM_DIMENSIONS.height, ROOM_DIMENSIONS.depth]} />
      <meshStandardMaterial color="#e9e1d2" roughness={0.8} />
    </mesh>
    <mesh position={[-halfRoomWidth, ROOM_DIMENSIONS.height / 2, 0]} receiveShadow>
      <boxGeometry args={[0.08, ROOM_DIMENSIONS.height, ROOM_DIMENSIONS.depth]} />
      <meshStandardMaterial color="#e9e1d2" roughness={0.8} />
    </mesh>

    <mesh position={[0, 0.23, halfRoomDepth - 0.06]} castShadow receiveShadow>
      <boxGeometry args={[ROOM_DIMENSIONS.width, 0.1, 0.08]} />
      <meshStandardMaterial color="#6a4a31" roughness={0.72} />
    </mesh>
    <mesh position={[0, 0.23, -halfRoomDepth + 0.06]} castShadow receiveShadow>
      <boxGeometry args={[ROOM_DIMENSIONS.width, 0.1, 0.08]} />
      <meshStandardMaterial color="#6a4a31" roughness={0.72} />
    </mesh>
    <mesh position={[halfRoomWidth - 0.06, 0.23, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.08, 0.1, ROOM_DIMENSIONS.depth]} />
      <meshStandardMaterial color="#6a4a31" roughness={0.72} />
    </mesh>
    <mesh position={[-halfRoomWidth + 0.06, 0.23, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.08, 0.1, ROOM_DIMENSIONS.depth]} />
      <meshStandardMaterial color="#6a4a31" roughness={0.72} />
    </mesh>
  </group>
);

const ShelfLip = ({ shelf }: { shelf: Shelf }) => {
  const thickness = 0.055;
  const y = shelf.position[1] + shelf.size.height / 2 + thickness / 2;
  const depthAxis = shelf.wall === "south" || shelf.wall === "north" ? "z" : "x";
  const lipPosition: [number, number, number] =
    shelf.wall === "south"
      ? [shelf.position[0], y, shelf.position[2] - shelf.size.depth / 2 + thickness / 2]
      : shelf.wall === "north"
        ? [shelf.position[0], y, shelf.position[2] + shelf.size.depth / 2 - thickness / 2]
        : shelf.wall === "east"
          ? [shelf.position[0] - shelf.size.width / 2 + thickness / 2, y, shelf.position[2]]
          : [shelf.position[0] + shelf.size.width / 2 - thickness / 2, y, shelf.position[2]];

  const lipSize: [number, number, number] =
    depthAxis === "z" ? [shelf.size.width, thickness, thickness] : [thickness, thickness, shelf.size.depth];

  return (
    <group>
      <mesh position={lipPosition} castShadow receiveShadow>
        <boxGeometry args={lipSize} />
        <meshStandardMaterial color={shelfEdge} roughness={0.72} />
      </mesh>
      <ShelfPriceTags shelf={shelf} y={y + 0.045} />
    </group>
  );
};

const ShelfPriceTags = ({ shelf, y }: { shelf: Shelf; y: number }) => {
  const tagCount = shelf.wall === "south" ? 16 : 12;
  const alongLength = shelf.wall === "south" || shelf.wall === "north" ? shelf.size.width : shelf.size.depth;
  const spacing = alongLength / tagCount;

  return (
    <group>
      {Array.from({ length: tagCount }, (_, index) => {
        const along = -alongLength / 2 + spacing / 2 + index * spacing;
        const position: [number, number, number] =
          shelf.wall === "south"
            ? [along, y, shelf.position[2] - shelf.size.depth / 2 - 0.012]
            : shelf.wall === "north"
              ? [along, y, shelf.position[2] + shelf.size.depth / 2 + 0.012]
              : shelf.wall === "east"
                ? [shelf.position[0] - shelf.size.width / 2 - 0.012, y, along]
                : [shelf.position[0] + shelf.size.width / 2 + 0.012, y, along];
        const rotation: [number, number, number] =
          shelf.wall === "south"
            ? [-0.12, 0, 0]
            : shelf.wall === "north"
              ? [-0.12, Math.PI, 0]
              : shelf.wall === "east"
                ? [-0.12, Math.PI / 2, 0]
                : [-0.12, -Math.PI / 2, 0];
        const color = index % 5 === 0 ? "#f1c846" : "#f7f1de";

        return (
          <mesh key={`${shelf.id}-tag-${index}`} position={position} rotation={rotation}>
            <boxGeometry args={[0.18, 0.055, 0.012]} />
            <meshBasicMaterial color={color} />
          </mesh>
        );
      })}
    </group>
  );
};

const ShelfPosts = () => {
  const verticalPostHeight = 3.55;
  const postY = verticalPostHeight / 2 + 0.28;
  const southXs = [-4.82, -2.42, 0, 2.42, 4.82];
  const northPostXs = [-4.3, -1.45, 1.45, 4.3];

  return (
    <group>
      {southXs.map((x) => (
        <mesh key={`south-front-${x}`} position={[x, postY, halfRoomDepth - 0.88]} castShadow receiveShadow>
          <cylinderGeometry args={[0.035, 0.035, verticalPostHeight, 10]} />
          <meshStandardMaterial color={shelfEdge} roughness={0.68} />
        </mesh>
      ))}
      {southXs.map((x) => (
        <mesh key={`south-back-${x}`} position={[x, postY, halfRoomDepth - 0.06]} castShadow receiveShadow>
          <cylinderGeometry args={[0.03, 0.03, verticalPostHeight, 10]} />
          <meshStandardMaterial color={shelfEdge} roughness={0.68} />
        </mesh>
      ))}
      {northPostXs.map((x) => (
        <mesh key={`north-${x}`} position={[x, 2.05, -halfRoomDepth + 0.82]} castShadow receiveShadow>
          <cylinderGeometry args={[0.03, 0.03, 2.8, 10]} />
          <meshStandardMaterial color={shelfEdge} roughness={0.68} />
        </mesh>
      ))}
      {sideWallPostPositions.map((z) => (
        <mesh key={`east-${z}`} position={[halfRoomWidth - 0.82, 2.05, z]} castShadow receiveShadow>
          <cylinderGeometry args={[0.03, 0.03, 2.8, 10]} />
          <meshStandardMaterial color={shelfEdge} roughness={0.68} />
        </mesh>
      ))}
      {sideWallPostPositions.map((z) => (
        <mesh key={`west-${z}`} position={[-halfRoomWidth + 0.82, 2.05, z]} castShadow receiveShadow>
          <cylinderGeometry args={[0.03, 0.03, 2.8, 10]} />
          <meshStandardMaterial color={shelfEdge} roughness={0.68} />
        </mesh>
      ))}
    </group>
  );
};

const Shelves = ({ shelves }: { shelves: Shelf[] }) => (
  <group>
    {shelves.map((shelf) => (
      <group key={shelf.id}>
        <mesh position={shelf.position} castShadow receiveShadow>
          <boxGeometry args={[shelf.size.width, shelf.size.height, shelf.size.depth]} />
          <meshStandardMaterial color={shelfWood} roughness={0.7} />
        </mesh>
        <ShelfLip shelf={shelf} />
      </group>
    ))}
    <ShelfPosts />
  </group>
);

const SouthWallRisers = () => (
  <group>
    {[3.5, 2.92, 2.34, 1.76, 1.18, 0.6].map((height) => (
      <mesh key={`south-riser-${height}`} position={[0, height + 0.055, halfRoomDepth - 0.53]} castShadow receiveShadow>
        <boxGeometry args={[9.5, 0.045, 0.12]} />
        <meshStandardMaterial color="#735136" roughness={0.76} />
      </mesh>
    ))}
    {[-3.55, -1.78, 0, 1.78, 3.55].map((x) => (
      <mesh key={`south-bay-divider-${x}`} position={[x, 2.02, halfRoomDepth - 0.9]} castShadow receiveShadow>
        <boxGeometry args={[0.045, 3.36, 0.08]} />
        <meshStandardMaterial color="#26190f" roughness={0.62} />
      </mesh>
    ))}
  </group>
);

const ReferenceBackboards = () => {
  const textures = useTexture(referencePhotos) as Texture[];

  useEffect(() => {
    textures.forEach((texture) => {
      texture.colorSpace = SRGBColorSpace;
      texture.needsUpdate = true;
    });
  }, [textures]);

  return (
    <group>
      {textures.map((texture, index) => (
        <mesh key={referencePhotos[index]} position={[-3.18 + index * 3.18, 2.08, halfRoomDepth - 0.045]}>
          <planeGeometry args={[3.05, 2.7]} />
          <meshBasicMaterial map={texture} transparent opacity={0.18} side={DoubleSide} toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
};

const ItemsLayer = ({
  items,
  matchedIds,
  selectedItemId,
  onSelect,
  onHover
}: {
  items: RoomItem[];
  matchedIds: Set<string>;
  selectedItemId: string | null;
  onSelect: (item: RoomItem) => void;
  onHover: (item: RoomItem | null) => void;
}) => (
  <group>
    {items.map((item) => (
      <ItemMesh
        key={item.id}
        item={item}
        highlighted={matchedIds.has(item.id)}
        selected={item.id === selectedItemId}
        onSelect={onSelect}
        onHover={onHover}
      />
    ))}
  </group>
);

const ItemTooltip = ({ item }: { item: RoomItem }) => (
  <Html position={[item.position[0], item.position[1] + item.size.height / 2 + 0.2, item.position[2]]} center distanceFactor={8}>
    <div className="item-tooltip" onPointerDown={(event) => event.stopPropagation()}>
      <strong>{item.name}</strong>
      <span>ID {item.id}</span>
      <span>[{formatPosition(item)}]</span>
    </div>
  </Html>
);

const formatKind = (kind: RoomItem["kind"]) => kind.replace(/([A-Z])/g, " $1").toLowerCase();

const ItemDetailPanel = ({ item, onClose }: { item: RoomItem; onClose: () => void }) => (
  <aside className="detail-panel" aria-label="Selected item details" onPointerDown={(event) => event.stopPropagation()}>
    <div className="detail-header">
      <span>Selected item</span>
      <button type="button" className="detail-close" aria-label="Close selected item details" onClick={onClose}>
        <X aria-hidden="true" size={16} strokeWidth={2.4} />
      </button>
    </div>

    <div className="detail-preview" aria-hidden="true">
      <Canvas dpr={[1, 2]} camera={{ fov: 34, position: [0, 0.3, 4.6], near: 0.1, far: 20 }}>
        <color attach="background" args={["#f7f1e8"]} />
        <ambientLight intensity={1.2} />
        <directionalLight position={[2, 4, 3]} intensity={1.45} />
        <directionalLight position={[-3, 2, -2]} intensity={0.58} />
        <ProductPreview item={item} />
      </Canvas>
    </div>

    <div className="detail-copy">
      <strong>{item.name}</strong>
      <span>{formatKind(item.kind)}</span>
    </div>

    <dl className="detail-list">
      <div>
        <dt>ID</dt>
        <dd>{item.id}</dd>
      </div>
      <div>
        <dt>Location</dt>
        <dd>
          {item.wall} wall · shelf {item.shelfLevel + 1}
        </dd>
      </div>
      <div>
        <dt>Position</dt>
        <dd>[{formatPosition(item)}]</dd>
      </div>
      <div>
        <dt>Size</dt>
        <dd>
          {item.size.width.toFixed(2)} × {item.size.height.toFixed(2)} × {item.size.depth.toFixed(2)} m
        </dd>
      </div>
    </dl>
  </aside>
);

const VisibleMatchCounter = ({ items, onChange }: { items: RoomItem[]; onChange: (count: number) => void }) => {
  const frustum = useMemo(() => new Frustum(), []);
  const matrix = useMemo(() => new Matrix4(), []);
  const point = useMemo(() => new Vector3(), []);
  const lastCount = useRef(-1);

  useEffect(() => {
    if (items.length === 0 && lastCount.current !== 0) {
      lastCount.current = 0;
      onChange(0);
    }
  }, [items.length, onChange]);

  useFrame(({ camera }) => {
    if (items.length === 0) {
      return;
    }

    camera.updateMatrixWorld();
    matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(matrix);

    let count = 0;

    items.forEach((item) => {
      const [x, y, z] = item.position;
      point.set(x, y, z);

      if (frustum.containsPoint(point)) {
        count += 1;
      }
    });

    if (count !== lastCount.current) {
      lastCount.current = count;
      onChange(count);
    }
  });

  return null;
};

const clampPercentValue = (value: number) => Math.min(100, Math.max(0, value));

const getMapPosition = (item: RoomItem) => ({
  x: clampPercentValue(((item.position[0] + ROOM_DIMENSIONS.width / 2) / ROOM_DIMENSIONS.width) * 100),
  y: clampPercentValue(((item.position[2] + ROOM_DIMENSIONS.depth / 2) / ROOM_DIMENSIONS.depth) * 100)
});

const MiniMap = ({
  items,
  matchedIds,
  selectedItem,
  hoveredItem,
  searchActive,
  onSelectItem,
  cameraMarkerRef,
  routeLineRef
}: {
  items: RoomItem[];
  matchedIds: Set<string>;
  selectedItem: RoomItem | null;
  hoveredItem: RoomItem | null;
  searchActive: boolean;
  onSelectItem: (item: RoomItem) => void;
  cameraMarkerRef: RefObject<HTMLSpanElement | null>;
  routeLineRef: RefObject<SVGLineElement | null>;
}) => {
  const selectedId = selectedItem?.id;
  const hoveredId = hoveredItem?.id;
  const routeEnd = selectedItem ? getMapPosition(selectedItem) : null;
  const displayItems = useMemo(() => {
    const baseItems = searchActive && matchedIds.size > 0 ? items.filter((item) => matchedIds.has(item.id)) : items.filter((_, index) => index % 2 === 0);

    if (!selectedItem || baseItems.some((item) => item.id === selectedItem.id)) {
      return baseItems;
    }

    return [...baseItems, selectedItem];
  }, [items, matchedIds, searchActive, selectedItem]);

  return (
    <aside className="minimap" aria-label="Room map">
      <div className="minimap-header">
        <span>Map</span>
        <span>{searchActive ? `${matchedIds.size} marked` : `${items.length} products`}</span>
      </div>
      <div className="minimap-stage">
        <div className="minimap-wall north" />
        <div className="minimap-wall south" />
        <div className="minimap-wall east" />
        <div className="minimap-wall west" />
        {routeEnd ? (
          <svg className="minimap-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <line ref={routeLineRef} x1="50" y1="50" x2={routeEnd.x} y2={routeEnd.y} />
          </svg>
        ) : null}
        {displayItems.map((item) => {
          const mapPosition = getMapPosition(item);
          const left = `${mapPosition.x}%`;
          const top = `${mapPosition.y}%`;
          const isActive = item.id === selectedId || item.id === hoveredId;
          const isMatch = matchedIds.has(item.id);

          return (
            <button
              key={`map-${item.id}`}
              type="button"
              className={isActive ? "minimap-dot active" : isMatch ? "minimap-dot match" : "minimap-dot"}
              aria-label={`Select ${item.name} on map`}
              title={item.name}
              onClick={() => onSelectItem(item)}
              style={{ left, top, backgroundColor: item.palette.primary }}
            />
          );
        })}
        <span ref={cameraMarkerRef} className="minimap-camera" />
      </div>
    </aside>
  );
};

const CameraTracker = ({
  cameraMarkerRef,
  routeLineRef
}: {
  cameraMarkerRef: RefObject<HTMLSpanElement | null>;
  routeLineRef: RefObject<SVGLineElement | null>;
}) => {
  const direction = useMemo(() => new Vector3(), []);
  const lastUpdate = useRef(0);

  useFrame(({ camera, clock }) => {
    const marker = cameraMarkerRef.current;
    const routeLine = routeLineRef.current;

    if (!marker || clock.elapsedTime - lastUpdate.current < 0.12) {
      return;
    }

    lastUpdate.current = clock.elapsedTime;
    camera.getWorldDirection(direction);
    const cameraX = clampPercentValue(((camera.position.x + ROOM_DIMENSIONS.width / 2) / ROOM_DIMENSIONS.width) * 100);
    const cameraY = clampPercentValue(((camera.position.z + ROOM_DIMENSIONS.depth / 2) / ROOM_DIMENSIONS.depth) * 100);

    marker.style.left = `${cameraX}%`;
    marker.style.top = `${cameraY}%`;
    marker.style.transform = `translate(-50%, -50%) rotate(${-Math.atan2(direction.x, direction.z)}rad)`;

    if (routeLine) {
      routeLine.setAttribute("x1", cameraX.toFixed(2));
      routeLine.setAttribute("y1", cameraY.toFixed(2));
    }
  });

  return null;
};

const OrbitKeyboardMovement = ({ controlsRef }: { controlsRef: RefObject<OrbitControlsHandle | null> }) => {
  const { camera } = useThree();
  const pressedKeys = useRef<Set<string>>(new Set());
  const forward = useRef(new Vector3());
  const right = useRef(new Vector3());
  const movement = useRef(new Vector3());

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTextEntryTarget(event.target) || !movementKeyCodes.has(event.code)) {
        return;
      }

      event.preventDefault();
      pressedKeys.current.add(event.code);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeys.current.delete(event.code);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      pressedKeys.current.clear();
    };
  }, []);

  useFrame((_, delta) => {
    const controls = controlsRef.current;

    if (!controls) {
      return;
    }

    const keys = pressedKeys.current;
    const moveForward = keys.has("KeyW") || keys.has("ArrowUp");
    const moveBack = keys.has("KeyS") || keys.has("ArrowDown");
    const moveLeft = keys.has("KeyA") || keys.has("ArrowLeft");
    const moveRight = keys.has("KeyD") || keys.has("ArrowRight");

    movement.current.set(0, 0, 0);

    if (!moveForward && !moveBack && !moveLeft && !moveRight) {
      return;
    }

    camera.getWorldDirection(forward.current);
    forward.current.y = 0;

    if (forward.current.lengthSq() === 0) {
      forward.current.set(0, 0, -1);
    } else {
      forward.current.normalize();
    }

    right.current.crossVectors(forward.current, camera.up).normalize();

    if (moveForward) {
      movement.current.add(forward.current);
    }

    if (moveBack) {
      movement.current.sub(forward.current);
    }

    if (moveRight) {
      movement.current.add(right.current);
    }

    if (moveLeft) {
      movement.current.sub(right.current);
    }

    if (movement.current.lengthSq() === 0) {
      return;
    }

    movement.current.normalize().multiplyScalar(2.35 * delta);

    const target = controls.target;
    const nextTargetX = MathUtils.clamp(target.x + movement.current.x, -ROOM_DIMENSIONS.width / 2 + 0.62, ROOM_DIMENSIONS.width / 2 - 0.62);
    const nextTargetZ = MathUtils.clamp(target.z + movement.current.z, -ROOM_DIMENSIONS.depth / 2 + 0.62, ROOM_DIMENSIONS.depth / 2 - 0.62);
    const correctionX = nextTargetX - target.x;
    const correctionZ = nextTargetZ - target.z;

    target.x = nextTargetX;
    target.z = nextTargetZ;
    camera.position.x += correctionX;
    camera.position.z += correctionZ;
    controls.update();
  });

  return null;
};

const SceneControls = ({
  mode,
  walkLookEnabled,
  walkResetSignal
}: {
  mode: ViewMode;
  walkLookEnabled: boolean;
  walkResetSignal: number;
}) => {
  const orbitControlsRef = useRef<OrbitControlsHandle | null>(null);

  if (mode === "walk") {
    return <Player lookEnabled={walkLookEnabled} resetSignal={walkResetSignal} />;
  }

  if (mode === "top") {
    return (
      <OrbitControls
        key="top-controls"
        makeDefault
        keyEvents={false}
        enableRotate={false}
        enableDamping
        dampingFactor={0.08}
        target={[0, 0, 0]}
        minDistance={6}
        maxDistance={30}
      />
    );
  }

  return (
    <>
      <OrbitControls
        ref={orbitControlsRef}
        key="orbit-controls"
        makeDefault
        keyEvents={false}
        enableDamping
        dampingFactor={0.08}
        target={[0, 1.65, 0]}
        minDistance={1.4}
        maxDistance={7.4}
        minPolarAngle={0.12}
        maxPolarAngle={Math.PI * 0.9}
      />
      <OrbitKeyboardMovement controlsRef={orbitControlsRef} />
    </>
  );
};

const ControlPanel = ({
  mode,
  onModeChange,
  query,
  worldQuery,
  searchInputRef,
  walkLookEnabled,
  onQueryChange,
  onClearQuery,
  onApplyQuery,
  onRecallPreviousWorldFilter,
  resultItems,
  onSelectItem,
  onPreviewItem,
  totalItems,
  inlineMatches,
  worldMatches,
  visibleWorldMatches,
  hoveredItem,
  selectedItem
}: {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  query: string;
  worldQuery: string;
  searchInputRef: RefObject<HTMLInputElement | null>;
  walkLookEnabled: boolean;
  onQueryChange: (query: string) => void;
  onClearQuery: () => void;
  onApplyQuery: () => void;
  onRecallPreviousWorldFilter: () => boolean;
  resultItems: RoomItem[];
  onSelectItem: (item: RoomItem) => void;
  onPreviewItem: (item: RoomItem | null) => void;
  totalItems: number;
  inlineMatches: number;
  worldMatches: number;
  visibleWorldMatches: number;
  hoveredItem: RoomItem | null;
  selectedItem: RoomItem | null;
}) => {
  const currentMode = modeOptions.find((option) => option.value === mode) ?? modeOptions[0];
  const trimmedQuery = query.trim();
  const worldTrimmedQuery = worldQuery.trim();
  const worldFilterChanged = trimmedQuery !== worldTrimmedQuery;
  const worldFilterApplied = worldTrimmedQuery.length > 0 && !worldFilterChanged;
  const searchFieldClassName = worldFilterApplied ? "search-field world-applied" : worldFilterChanged ? "search-field world-pending" : "search-field";
  const worldFilterClassName = worldFilterApplied ? "world-filter applied" : worldFilterChanged ? "world-filter pending" : "world-filter";
  const worldFilterLabel = worldFilterApplied ? "Applied to room" : worldFilterChanged ? "Room waiting" : "World filter";
  const instruction =
    mode === "walk"
      ? walkLookEnabled
        ? "Mouse look on. Move the mouse to turn. Press S to click items."
        : "Mouse look off. Click items freely. Press S to turn with the mouse."
      : currentMode.instruction;
  const resultText =
    worldTrimmedQuery.length > 0
      ? worldMatches > 0
        ? `${visibleWorldMatches} in view / ${worldMatches} matches`
        : "No matches"
      : `${totalItems} items`;
  const compactResultText =
    worldTrimmedQuery.length > 0
      ? worldMatches > 0
        ? `${visibleWorldMatches}/${worldMatches}`
        : "None"
      : `${totalItems}`;
  const activeItem = hoveredItem ?? selectedItem;
  const hasResults = trimmedQuery.length > 0 && resultItems.length > 0;
  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onApplyQuery();
      return;
    }

    if (event.key === "ArrowUp" && onRecallPreviousWorldFilter()) {
      event.preventDefault();
    }
  };

  return (
    <section className="panel" aria-label="3D room controls">
      <div className="panel-header">
        <div className="title-lockup">
          <h1>3D Room</h1>
          <span>Grocery shelf explorer</span>
        </div>
        <div className="panel-actions">
          <span className={worldMatches === 0 && worldTrimmedQuery.length > 0 ? "result-count empty" : "result-count"} aria-label={resultText}>
            <span className="result-count-full">{resultText}</span>
            <span className="result-count-short">{compactResultText}</span>
          </span>
        </div>
      </div>

      <div className="mode-toggle" role="group" aria-label="View mode">
        {modeOptions.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            className={mode === value ? "mode-button active" : "mode-button"}
            onClick={() => onModeChange(value)}
          >
            <Icon aria-hidden="true" size={16} strokeWidth={2.2} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <p className="instruction">{instruction}</p>

      <div className={searchFieldClassName}>
        <Search aria-hidden="true" size={17} strokeWidth={2.2} />
        <input
          ref={searchInputRef}
          type="search"
          aria-label="Search items"
          value={query}
          placeholder="Search milk, olive oil, chips"
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
        {worldFilterChanged ? (
          <button type="button" className="apply-filter-button" aria-label="Apply search to room" onClick={onApplyQuery}>
            <CornerDownLeft aria-hidden="true" size={16} strokeWidth={2.3} />
          </button>
        ) : null}
        {query.length > 0 ? (
          <button type="button" className="clear-search" aria-label="Clear search" onClick={onClearQuery}>
            <X aria-hidden="true" size={16} strokeWidth={2.4} />
          </button>
        ) : null}
      </div>

      <div className="suggestion-tray" aria-label="Search suggestions">
        {searchSuggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className={trimmedQuery.toLowerCase() === suggestion ? "suggestion active" : "suggestion"}
            onClick={() => onQueryChange(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className={worldFilterClassName}>
        <Globe2 aria-hidden="true" size={15} strokeWidth={2.2} />
        <span>{worldFilterLabel}</span>
        <strong>{worldTrimmedQuery.length > 0 ? worldTrimmedQuery : "None"}</strong>
      </div>

      {hasResults ? (
        <div className="result-list" aria-label="Live search results">
          <div className="result-list-header">
            <span>Quick results</span>
            <span>{inlineMatches}</span>
          </div>
          {resultItems.slice(0, 7).map((item) => (
            <button
              key={`result-${item.id}`}
              type="button"
              className={selectedItem?.id === item.id ? "result-row active" : "result-row"}
              onClick={() => onSelectItem(item)}
              onMouseEnter={() => onPreviewItem(item)}
              onMouseLeave={() => onPreviewItem(null)}
            >
              <span className="result-swatch" style={{ backgroundColor: item.palette.primary }} />
              <span className="result-copy">
                <strong>{item.name}</strong>
                <span>
                  {item.wall} wall · level {item.shelfLevel + 1} · ID {item.id}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : trimmedQuery.length > 0 ? (
        <div className="empty-results">No products match that search.</div>
      ) : null}

      <div className="inspection-strip">
        <PackageSearch aria-hidden="true" size={16} strokeWidth={2.2} />
        {activeItem ? (
          <div>
            <strong>{activeItem.name}</strong>
            <span>
              ID {activeItem.id} · {activeItem.wall} wall · [{formatPosition(activeItem)}]
            </span>
          </div>
        ) : (
          <div>
            <strong>South wall: 192 products</strong>
            <span>North, east, west walls: 108 pantry products</span>
          </div>
        )}
      </div>
    </section>
  );
};

const WebGLFallback = () => (
  <div className="webgl-fallback">
    <strong>3D view unavailable</strong>
    <span>Your browser could not start WebGL. Try a hardware-accelerated browser window.</span>
  </div>
);

export const Room = () => {
  const room = useMemo(() => buildRoom(), []);
  const initialSearchQuery = useMemo(getInitialSearchQuery, []);
  const [mode, setMode] = useState<ViewMode>("top");
  const [searchInput, setSearchInput] = useState(initialSearchQuery);
  const [worldSearchQuery, setWorldSearchQuery] = useState(initialSearchQuery);
  const [worldFilterHistory, setWorldFilterHistory] = useState<string[]>(() => {
    const initialTerm = initialSearchQuery.trim();

    return initialTerm.length > 0 ? [initialTerm] : [];
  });
  const [worldFilterHistoryCursor, setWorldFilterHistoryCursor] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<RoomItem | null>(null);
  const [hoveredItem, setHoveredItem] = useState<RoomItem | null>(null);
  const [visibleMatchCount, setVisibleMatchCount] = useState(0);
  const [walkLookEnabled, setWalkLookEnabled] = useState(false);
  const [walkResetSignal, setWalkResetSignal] = useState(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const cameraMarkerRef = useRef<HTMLSpanElement | null>(null);
  const routeLineRef = useRef<SVGLineElement | null>(null);
  const normalizedInlineQuery = searchInput.trim().toLowerCase();
  const normalizedWorldQuery = worldSearchQuery.trim().toLowerCase();
  const worldSearchActive = normalizedWorldQuery.length > 0;

  const inlineMatchingItems = useMemo(
    () => (normalizedInlineQuery.length === 0 ? [] : room.items.filter((item) => item.name.toLowerCase().includes(normalizedInlineQuery))),
    [normalizedInlineQuery, room.items]
  );

  const worldMatchingItems = useMemo(
    () => (normalizedWorldQuery.length === 0 ? [] : room.items.filter((item) => item.name.toLowerCase().includes(normalizedWorldQuery))),
    [normalizedWorldQuery, room.items]
  );

  const matchedIds = useMemo(() => new Set(worldMatchingItems.map((item) => item.id)), [worldMatchingItems]);
  const previewResultItems = useMemo(() => inlineMatchingItems.slice(0, 7), [inlineMatchingItems]);

  useEffect(() => {
    setVisibleMatchCount(0);
  }, [normalizedWorldQuery, mode]);

  useEffect(() => {
    setHoveredItem(null);

    if (mode !== "walk") {
      setWalkLookEnabled(false);
    }
  }, [mode]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (event.metaKey || event.ctrlKey) {
        const nextMode = commandModeShortcuts[event.key.toLowerCase()];

        if (nextMode) {
          event.preventDefault();
          setMode(nextMode);
          return;
        }
      }

      if (isTextEntryTarget(event.target)) {
        return;
      }

      if (event.key === "Escape") {
        setSearchInput("");
        setWorldSearchQuery("");
        setWorldFilterHistoryCursor(null);
        setSelectedItem(null);
        setWalkLookEnabled(false);
        return;
      }

      if (mode === "walk" && event.code === "KeyS") {
        event.preventDefault();
        setWalkLookEnabled((enabled) => !enabled);
        return;
      }

      if (mode === "walk" && (event.code === "KeyR" || event.code === "Home" || event.code === "Digit0")) {
        event.preventDefault();
        setWalkResetSignal((value) => value + 1);
        return;
      }

      const nextMode = modeShortcuts[event.key];

      if (nextMode) {
        event.preventDefault();
        setMode(nextMode);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mode]);

  useEffect(() => {
    const url = new URL(window.location.href);

    if (worldSearchQuery.trim().length > 0) {
      url.searchParams.set("q", worldSearchQuery.trim());
    } else {
      url.searchParams.delete("q");
    }

    window.history.replaceState(null, "", url);
  }, [worldSearchQuery]);

  const handleSearchInputChange = (query: string) => {
    setSearchInput(query);
    setWorldFilterHistoryCursor(null);
  };

  const handleClearSearch = () => {
    handleSearchInputChange("");
    setWorldSearchQuery("");
  };

  const handleApplySearch = () => {
    const nextWorldFilter = searchInput.trim();

    setWorldSearchQuery(nextWorldFilter);
    setWorldFilterHistoryCursor(null);

    if (nextWorldFilter.length > 0) {
      setWorldFilterHistory((history) => [...history, nextWorldFilter]);
    }
  };

  const handleRecallPreviousWorldFilter = () => {
    if (worldFilterHistory.length === 0) {
      return false;
    }

    const nextCursor = worldFilterHistoryCursor === null ? worldFilterHistory.length - 1 : Math.max(0, worldFilterHistoryCursor - 1);

    setWorldFilterHistoryCursor(nextCursor);
    setSearchInput(worldFilterHistory[nextCursor]);

    return true;
  };

  return (
    <main className={`room-app mode-${mode}`}>
      <Canvas
        className="scene-canvas"
        dpr={[1, 2]}
        camera={{ fov: 50, position: [0, 22.5, 0], near: 0.08, far: 80 }}
        fallback={<WebGLFallback />}
        onPointerMissed={() => setHoveredItem(null)}
      >
        <color attach="background" args={["#d8d1c4"]} />
        <ambientLight intensity={0.86} />
        <hemisphereLight color="#fff8e7" groundColor="#5b4632" intensity={1.45} />
        <directionalLight position={[-3.5, 7, -4]} intensity={1.35} />
        <pointLight position={[0, 3.45, -1.4]} color="#fff2d1" intensity={2.1} distance={8} />
        <pointLight position={[0, 2.7, 4.1]} color="#fff1cb" intensity={1.1} distance={6} />

        <CameraRig mode={mode} />
        <RoomShell showCeiling={mode !== "top"} />
        <Suspense fallback={null}>
          <ReferenceBackboards />
        </Suspense>
        <Shelves shelves={room.shelves} />
        <SouthWallRisers />
        <ItemsLayer
          items={room.items}
          matchedIds={matchedIds}
          selectedItemId={selectedItem?.id ?? null}
          onSelect={setSelectedItem}
          onHover={setHoveredItem}
        />
        {hoveredItem ? <ItemTooltip item={hoveredItem} /> : null}
        <VisibleMatchCounter items={worldMatchingItems} onChange={setVisibleMatchCount} />
        <CameraTracker cameraMarkerRef={cameraMarkerRef} routeLineRef={routeLineRef} />
        <SceneControls mode={mode} walkLookEnabled={walkLookEnabled} walkResetSignal={walkResetSignal} />
      </Canvas>

      <ControlPanel
        mode={mode}
        onModeChange={setMode}
        query={searchInput}
        worldQuery={worldSearchQuery}
        searchInputRef={searchInputRef}
        walkLookEnabled={walkLookEnabled}
        onQueryChange={handleSearchInputChange}
        onClearQuery={handleClearSearch}
        onApplyQuery={handleApplySearch}
        onRecallPreviousWorldFilter={handleRecallPreviousWorldFilter}
        resultItems={previewResultItems}
        onSelectItem={setSelectedItem}
        onPreviewItem={setHoveredItem}
        totalItems={room.items.length}
        inlineMatches={inlineMatchingItems.length}
        worldMatches={worldMatchingItems.length}
        visibleWorldMatches={visibleMatchCount}
        hoveredItem={hoveredItem}
        selectedItem={selectedItem}
      />

      {selectedItem ? <ItemDetailPanel item={selectedItem} onClose={() => setSelectedItem(null)} /> : null}

      <MiniMap
        items={room.items}
        matchedIds={matchedIds}
        selectedItem={selectedItem}
        hoveredItem={hoveredItem}
        searchActive={worldSearchActive}
        onSelectItem={setSelectedItem}
        cameraMarkerRef={cameraMarkerRef}
        routeLineRef={routeLineRef}
      />
    </main>
  );
};
