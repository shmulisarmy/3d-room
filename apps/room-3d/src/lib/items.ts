export const ROOM_DIMENSIONS = {
  width: 10,
  depth: 14,
  height: 4
} as const;

export const SOUTH_SHELF_HEIGHTS = [3.5, 2.92, 2.34, 1.76, 1.18, 0.6] as const;
export const SIDE_SHELF_HEIGHTS = [2.6, 1.7, 0.8] as const;

export type Vec3 = [number, number, number];
export type WallName = "south" | "north" | "east" | "west";
export type ShelfRow = "front" | "back" | "single";

export type ItemKind =
  | "chipsBag"
  | "cheeseCurlsBox"
  | "coffeeBag"
  | "teaBoxGreen"
  | "teaBoxPurple"
  | "coffeeTin"
  | "salsaJar"
  | "honeyJar"
  | "jamJar"
  | "hotSauceBottle"
  | "mustardBottle"
  | "oliveOilBottle"
  | "vinegarBottle"
  | "dressingBottle"
  | "cannedBeans"
  | "milkCarton"
  | "juiceCarton"
  | "cerealBox"
  | "riceBag"
  | "mapleSyrupJug"
  | "breadLoaf"
  | "apple"
  | "can"
  | "jar";

export interface ProductSize {
  width: number;
  height: number;
  depth: number;
}

export interface ProductPalette {
  primary: string;
  secondary: string;
  accent: string;
  label: string;
  cap: string;
}

export interface RoomItem {
  id: string;
  name: string;
  kind: ItemKind;
  wall: WallName;
  shelfLevel: number;
  row: ShelfRow;
  position: Vec3;
  rotation: Vec3;
  size: ProductSize;
  palette: ProductPalette;
}

export interface Shelf {
  id: string;
  wall: WallName;
  level: number;
  height: number;
  position: Vec3;
  size: ProductSize;
}

export interface RoomBuild {
  items: RoomItem[];
  shelves: Shelf[];
}

interface ProductTemplate {
  name: string;
  kind: ItemKind;
  size: ProductSize;
  palette: ProductPalette;
}

const shelfBoardHeight = 0.07;
const halfRoomWidth = ROOM_DIMENSIONS.width / 2;
const halfRoomDepth = ROOM_DIMENSIONS.depth / 2;

const wallRotation: Record<WallName, Vec3> = {
  south: [0, 0, 0],
  north: [0, Math.PI, 0],
  east: [0, Math.PI / 2, 0],
  west: [0, -Math.PI / 2, 0]
};

const makeSize = (width: number, height: number, depth: number): ProductSize => ({
  width,
  height,
  depth
});

const makePalette = (
  primary: string,
  secondary: string,
  accent: string,
  label: string,
  cap: string
): ProductPalette => ({
  primary,
  secondary,
  accent,
  label,
  cap
});

const product = (
  name: string,
  kind: ItemKind,
  size: ProductSize,
  palette: ProductPalette
): ProductTemplate => ({
  name,
  kind,
  size,
  palette
});

const chipsSize = makeSize(0.36, 0.42, 0.16);
const boxSize = makeSize(0.38, 0.34, 0.18);
const coffeeBagSize = makeSize(0.32, 0.4, 0.18);
const teaBoxSize = makeSize(0.32, 0.28, 0.18);
const jarSize = makeSize(0.24, 0.32, 0.24);
const sauceBottleSize = makeSize(0.18, 0.48, 0.18);
const mustardSize = makeSize(0.2, 0.42, 0.18);
const tallBottleSize = makeSize(0.2, 0.58, 0.2);
const canSize = makeSize(0.24, 0.24, 0.24);
const cartonSize = makeSize(0.28, 0.48, 0.22);
const cerealSize = makeSize(0.34, 0.5, 0.16);
const riceBagSize = makeSize(0.34, 0.38, 0.2);
const syrupJugSize = makeSize(0.3, 0.44, 0.22);

const southThemes: ProductTemplate[][] = [
  [
    product("sea salt chips", "chipsBag", chipsSize, makePalette("#f7f0df", "#284e90", "#d32630", "#ffffff", "#ece6d6")),
    product("jalapeno chips", "chipsBag", chipsSize, makePalette("#75b843", "#2f6b2f", "#f2e865", "#ffffff", "#e9f2d6")),
    product("kettle chips", "chipsBag", chipsSize, makePalette("#fbfbf3", "#101010", "#2e83c2", "#ffffff", "#dadada")),
    product("baked cheese curls", "cheeseCurlsBox", boxSize, makePalette("#f07b22", "#f6c036", "#2f77be", "#fff2bd", "#6b3a1e")),
    product("cheese curls", "cheeseCurlsBox", boxSize, makePalette("#ff9b22", "#ffe15d", "#bd2c2c", "#fff6ca", "#7a3516")),
    product("sumatra coffee", "coffeeBag", coffeeBagSize, makePalette("#2d6b52", "#111111", "#c4e1d6", "#f5f1dc", "#161616")),
    product("ethiopia coffee", "coffeeBag", coffeeBagSize, makePalette("#f14969", "#151515", "#ffe268", "#fff5d7", "#171717")),
    product("brooklyn coffee", "coffeeBag", coffeeBagSize, makePalette("#9bd8cf", "#2e5f56", "#f4e6bb", "#f7f6e8", "#16463e"))
  ],
  [
    product("stash green tea", "teaBoxGreen", teaBoxSize, makePalette("#4f9f58", "#e7f2df", "#203c22", "#fff8de", "#1b3320")),
    product("stash mint tea", "teaBoxGreen", teaBoxSize, makePalette("#91c753", "#18361f", "#ffffff", "#f9f5df", "#18361f")),
    product("tazo purple tea", "teaBoxPurple", teaBoxSize, makePalette("#f3efe7", "#6e4e9b", "#d42c83", "#fff8e7", "#4a2f6f")),
    product("chai tea", "teaBoxPurple", teaBoxSize, makePalette("#b12e68", "#f4cf58", "#7a3c1f", "#fff2c7", "#65301e")),
    product("earl grey tea", "teaBoxGreen", teaBoxSize, makePalette("#d8e9ef", "#30506d", "#f4c95d", "#fff8e5", "#294253")),
    product("coffee tin", "coffeeTin", makeSize(0.25, 0.34, 0.25), makePalette("#d9c299", "#454545", "#f7de73", "#fff7df", "#b9aa8a")),
    product("french roast coffee", "coffeeBag", coffeeBagSize, makePalette("#603a29", "#111111", "#d9a442", "#f4ead0", "#121212"))
  ],
  [
    product("tomato salsa", "salsaJar", jarSize, makePalette("#b63424", "#f8df9d", "#315c35", "#fff7d0", "#6a1714")),
    product("green salsa", "salsaJar", jarSize, makePalette("#6c8b38", "#f3df99", "#a02b21", "#fff7d3", "#344f21")),
    product("wildflower honey", "honeyJar", jarSize, makePalette("#d99326", "#f7df68", "#5b3b1b", "#fff4bd", "#f5d74d")),
    product("clover honey", "honeyJar", jarSize, makePalette("#f0b73e", "#e05d27", "#fbef9c", "#fff1bf", "#e7bd36")),
    product("strawberry jam", "jamJar", jarSize, makePalette("#9f2531", "#f6ddcf", "#4e7e3f", "#fff4e8", "#8d1f29")),
    product("apricot jam", "jamJar", jarSize, makePalette("#dc8a2e", "#f8e2c8", "#8e3a23", "#fff4d6", "#be6c24"))
  ],
  [
    product("hot sauce", "hotSauceBottle", sauceBottleSize, makePalette("#b43a20", "#111111", "#f0d05d", "#fff8dc", "#171717")),
    product("chili garlic hot sauce", "hotSauceBottle", sauceBottleSize, makePalette("#d34a20", "#25723b", "#ffffff", "#fff2dd", "#2a6f3b")),
    product("smoked hot sauce", "hotSauceBottle", sauceBottleSize, makePalette("#5a231b", "#111111", "#f39b32", "#f9ead5", "#191919")),
    product("yellow mustard", "mustardBottle", mustardSize, makePalette("#edc928", "#1f1f1f", "#ffffff", "#fff7cc", "#f6d83f")),
    product("dijon mustard", "mustardBottle", mustardSize, makePalette("#c49a2c", "#3d2d1d", "#e6e1c6", "#fff0c7", "#cfb35b")),
    product("mustard squeeze", "mustardBottle", mustardSize, makePalette("#f1cf2e", "#ffec79", "#245e2d", "#fff7be", "#2f7d39"))
  ],
  [
    product("olive oil", "oliveOilBottle", tallBottleSize, makePalette("#24402a", "#f1d26a", "#1b1b1b", "#fff2c4", "#c7a646")),
    product("extra virgin olive oil", "oliveOilBottle", tallBottleSize, makePalette("#2f5a2f", "#f7e078", "#ef5a2a", "#fff5cd", "#caa34a")),
    product("red wine vinegar", "vinegarBottle", tallBottleSize, makePalette("#7c1f2a", "#efefef", "#333333", "#fff7e2", "#242424")),
    product("balsamic vinegar", "vinegarBottle", tallBottleSize, makePalette("#211c18", "#e7cf8d", "#ffffff", "#fff1c9", "#ad8c40")),
    product("sesame dressing", "dressingBottle", makeSize(0.22, 0.48, 0.2), makePalette("#f2d88a", "#ffffff", "#cf3a2f", "#fff6d5", "#eeeeee")),
    product("avocado dressing", "dressingBottle", makeSize(0.22, 0.48, 0.2), makePalette("#b9d16d", "#ffffff", "#548b44", "#fff7e3", "#eeeeee"))
  ],
  [
    product("canned beans", "cannedBeans", canSize, makePalette("#d8d8d2", "#327b72", "#eacb56", "#fff7de", "#c5c5be")),
    product("black beans", "cannedBeans", canSize, makePalette("#1f2326", "#efefdc", "#4b8f81", "#fff8e1", "#d0d0c7")),
    product("kidney beans", "cannedBeans", canSize, makePalette("#8a2733", "#f1e0ce", "#384f85", "#fff4df", "#d5c5b4")),
    product("milk carton", "milkCarton", cartonSize, makePalette("#fbfaf2", "#f4a13d", "#7eb1d8", "#fff6df", "#f4f4ea")),
    product("orange juice", "juiceCarton", cartonSize, makePalette("#f9a03b", "#f7f2d4", "#3a7e45", "#fff2d1", "#f4f4ea")),
    product("cereal box", "cerealBox", cerealSize, makePalette("#2b75bd", "#f8ca3a", "#dc3c2c", "#fff0c7", "#5d3421")),
    product("rice bag", "riceBag", riceBagSize, makePalette("#5a78c5", "#f4efe0", "#f3c43a", "#fff6df", "#e9e1d5")),
    product("maple syrup jug", "mapleSyrupJug", syrupJugSize, makePalette("#efe8c7", "#f28b35", "#6b3b20", "#fff5d8", "#151515"))
  ]
];

const sideTemplates: ProductTemplate[] = [
  product("milk", "milkCarton", cartonSize, makePalette("#fbfaf2", "#69a8d8", "#f6a23c", "#fff6df", "#f5f5f0")),
  product("bread", "breadLoaf", makeSize(0.36, 0.28, 0.22), makePalette("#c88945", "#f4d39a", "#7b3b20", "#fff5d3", "#a96833")),
  product("apple", "apple", makeSize(0.22, 0.24, 0.22), makePalette("#c9372f", "#5d8d3b", "#7a4022", "#f7f1d7", "#5d8d3b")),
  product("can", "can", canSize, makePalette("#c9d8df", "#2e87a0", "#e6c247", "#fff8dd", "#c7c7c0")),
  product("cereal", "cerealBox", cerealSize, makePalette("#e4bc36", "#2c6fb3", "#d63a2d", "#fff2c9", "#5b321e")),
  product("jar", "jar", jarSize, makePalette("#cf8a32", "#f4e0b8", "#3d6b39", "#fff6da", "#1f1f1f"))
];

const createRandom = (seed: number) => {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

const nextId = (random: () => number, usedIds: Set<string>) => {
  let id = "";

  do {
    id = Math.floor(10000000 + random() * 90000000).toString();
  } while (usedIds.has(id));

  usedIds.add(id);
  return id;
};

const jitter = (random: () => number, amount: number) => (random() - 0.5) * amount;

const createShelf = (wall: WallName, height: number, level: number): Shelf => {
  const southOrNorth = wall === "south" || wall === "north";
  const shelfDepth = wall === "south" ? 0.86 : 0.56;
  const alongLength = southOrNorth ? ROOM_DIMENSIONS.width - 0.3 : ROOM_DIMENSIONS.depth - 0.3;
  const position: Vec3 =
    wall === "south"
      ? [0, height - shelfBoardHeight / 2, halfRoomDepth - shelfDepth / 2]
      : wall === "north"
        ? [0, height - shelfBoardHeight / 2, -halfRoomDepth + shelfDepth / 2 + 0.15]
        : wall === "east"
          ? [halfRoomWidth - shelfDepth / 2 - 0.15, height - shelfBoardHeight / 2, 0]
          : [-halfRoomWidth + shelfDepth / 2 + 0.15, height - shelfBoardHeight / 2, 0];

  return {
    id: `${wall}-${level}`,
    wall,
    level,
    height,
    position,
    size: southOrNorth
      ? makeSize(alongLength, shelfBoardHeight, shelfDepth)
      : makeSize(shelfDepth, shelfBoardHeight, alongLength)
  };
};

const createSouthItem = (
  template: ProductTemplate,
  level: number,
  shelfHeight: number,
  column: number,
  row: ShelfRow,
  random: () => number,
  id: string
): RoomItem => {
  const spacing = 9.15 / 16;
  const x = -4.575 + spacing / 2 + column * spacing + jitter(random, 0.04);
  const z = row === "back" ? halfRoomDepth - 0.34 + jitter(random, 0.03) : halfRoomDepth - 0.78 + jitter(random, 0.04);
  const rowLift = row === "back" ? 0.08 : 0;

  return {
    id,
    name: template.name,
    kind: template.kind,
    wall: "south",
    shelfLevel: level,
    row,
    position: [x, shelfHeight + rowLift + template.size.height / 2, z],
    rotation: wallRotation.south,
    size: template.size,
    palette: template.palette
  };
};

const createSideItem = (
  template: ProductTemplate,
  wall: Exclude<WallName, "south">,
  level: number,
  shelfHeight: number,
  column: number,
  random: () => number,
  id: string
): RoomItem => {
  const alongLength = wall === "north" ? ROOM_DIMENSIONS.width - 1.15 : ROOM_DIMENSIONS.depth - 1.15;
  const spacing = alongLength / 12;
  const along = -alongLength / 2 + spacing / 2 + column * spacing + jitter(random, 0.06);
  const widthInset = halfRoomWidth - 0.7 + jitter(random, 0.04);
  const depthInset = halfRoomDepth - 0.7 + jitter(random, 0.04);
  const position: Vec3 =
    wall === "north"
      ? [along, shelfHeight + template.size.height / 2, -depthInset]
      : wall === "east"
        ? [widthInset, shelfHeight + template.size.height / 2, along]
        : [-widthInset, shelfHeight + template.size.height / 2, along];

  return {
    id,
    name: template.name,
    kind: template.kind,
    wall,
    shelfLevel: level,
    row: "single",
    position,
    rotation: wallRotation[wall],
    size: template.size,
    palette: template.palette
  };
};

export const buildRoom = (): RoomBuild => {
  const random = createRandom(20260427);
  const usedIds = new Set<string>();
  const shelves: Shelf[] = [];
  const items: RoomItem[] = [];

  SOUTH_SHELF_HEIGHTS.forEach((height, level) => {
    shelves.push(createShelf("south", height, level));

    (["back", "front"] satisfies ShelfRow[]).forEach((row) => {
      for (let column = 0; column < 16; column += 1) {
        const template = southThemes[level][(column + (row === "back" ? 3 : 0)) % southThemes[level].length];
        items.push(createSouthItem(template, level, height, column, row, random, nextId(random, usedIds)));
      }
    });
  });

  (["north", "east", "west"] satisfies Exclude<WallName, "south">[]).forEach((wall, wallIndex) => {
    SIDE_SHELF_HEIGHTS.forEach((height, level) => {
      shelves.push(createShelf(wall, height, level));

      for (let column = 0; column < 12; column += 1) {
        const template = sideTemplates[(column + level * 2 + wallIndex) % sideTemplates.length];
        items.push(createSideItem(template, wall, level, height, column, random, nextId(random, usedIds)));
      }
    });
  });

  return { items, shelves };
};
