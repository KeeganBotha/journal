// Renders the app icon (an SVG built below) to every raster the app needs.
// Run: node scripts/generate-icons.mjs   (sharp ships with Next, no install)
// ICON_OUT=/some/dir renders into that dir instead of the repo (for previews).
//
//   public/icons/icon-192.png           manifest "any"      rounded, transparent corners
//   public/icons/icon-512.png           manifest "any"
//   public/icons/icon-512-maskable.png  manifest "maskable" full-bleed, art inside 80% safe zone
//   src/app/apple-icon.png              iOS Home Screen     full-bleed, iOS applies its own mask
//   src/app/icon.png                    favicon             rounded
//
// Style matches the CardCrate icon: isometric flat-3D, pastel fills, no
// gradients, cream background. Geometry is built from a tiny isometric
// projection so faces line up exactly.
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = process.env.ICON_OUT ?? ".";
const out = (p) => path.join(OUT, p);
await mkdir(out("public/icons"), { recursive: true });
await mkdir(out("src/app"), { recursive: true });

const S = 512;
const BG = "#F8F3E5"; // CardCrate background

// Isometric projection: +x runs down-right, +y runs down-left, +z is up.
const COS = 0.866;
const SIN = 0.5;
const CX = 272;
const CY = 196;
const P = (x, y, z) => `${(CX + (x - y) * COS).toFixed(2)},${(CY + (x + y) * SIN - z).toFixed(2)}`;
const poly = (fill, pts, extra = "") =>
  `<polygon fill="${fill}" points="${pts.map((p) => P(...p)).join(" ")}" ${extra}/>`;
// Same-colour thick round-joined stroke = softly rounded corners (CardCrate look).
const soft = (fill, r = 10) => `stroke="${fill}" stroke-width="${r}" stroke-linejoin="round"`;

// Book: spine at x=0 (hidden, up-left), fore-edge at x=W, head y=0, tail y=D.
const W = 200;
const D = 250;
const H = 110;
const BOARD = 7; // cover board thickness seen on the side faces

const C = {
  // Sampled from the CardCrate icon so the suite shares one palette.
  coverTop: "#AEDFF7",
  coverEdge: "#96BFFE",
  coverEdgeDark: "#7FA6EE",
  coverPanel: "#C4E9FA",
  pagesLit: "#FDF6E3", // tail face (down-left, lit like CardCrate's front)
  pagesDim: "#F5EAD0", // fore-edge face (down-right, in shade)
  pagesLine: "#E9DCB8",
  pagesShade: "#EBDDBB",
  ribbon: "#FC7E50",
  ribbonDark: "#BE5439",
  pencil: "#FFF3B0",
  pencilSide: "#FEDD6D",
  wood: "#F5DDB0",
  woodDark: "#E3C48C",
  lead: "#803321",
  leadDark: "#5A2417",
  band: "#C3CFDB",
  bandDark: "#A9B6C4",
  eraser: "#F7C9C0",
  eraserDark: "#E9998E",
  shadow: "#96BFFE",
};

function book() {
  const parts = [];

  // Side faces: page block (cream) between two cover boards.
  // Fore-edge face (x = W).
  parts.push(poly(C.pagesDim, [[W, 0, BOARD], [W, D, BOARD], [W, D, H - BOARD], [W, 0, H - BOARD]]));
  parts.push(poly(C.pagesShade, [[W, 0, BOARD], [W, D, BOARD], [W, D, BOARD + 14], [W, 0, BOARD + 14]]));
  for (const z of [24, 40, 56, 72, 88]) {
    parts.push(poly(C.pagesLine, [[W, 0, z], [W, D, z], [W, D, z + 3], [W, 0, z + 3]]));
  }
  // Tail face (y = D).
  parts.push(poly(C.pagesLit, [[0, D, BOARD], [W, D, BOARD], [W, D, H - BOARD], [0, D, H - BOARD]]));
  parts.push(poly(C.pagesShade, [[0, D, BOARD], [W, D, BOARD], [W, D, BOARD + 14], [0, D, BOARD + 14]]));
  for (const z of [24, 40, 56, 72, 88]) {
    parts.push(poly(C.pagesLine, [[0, D, z], [W, D, z], [W, D, z + 3], [0, D, z + 3]]));
  }
  // Cover boards on the side faces.
  parts.push(poly(C.coverEdgeDark, [[W, 0, 0], [W, D, 0], [W, D, BOARD], [W, 0, BOARD]]));
  parts.push(poly(C.coverEdgeDark, [[W, 0, H - BOARD], [W, D, H - BOARD], [W, D, H], [W, 0, H]]));
  parts.push(poly(C.coverEdge, [[0, D, 0], [W, D, 0], [W, D, BOARD], [0, D, BOARD]]));
  parts.push(poly(C.coverEdge, [[0, D, H - BOARD], [W, D, H - BOARD], [W, D, H], [0, D, H]]));

  // Ribbon bookmark hanging out of the tail, down the tail face and past the bottom.
  const rx = 132;
  const rw = 24;
  parts.push(poly(C.ribbon, [[rx, D, H - BOARD - 2], [rx + rw, D, H - BOARD - 2], [rx + rw, D, -36], [rx, D, -36]]));
  parts.push(poly(C.ribbonDark, [[rx, D, -36], [rx + rw, D, -36], [rx + rw, D, -50], [rx, D, -50]]));
  parts.push(poly(C.ribbonDark, [[rx, D, H - BOARD - 2], [rx + rw, D, H - BOARD - 2], [rx + rw, D, H - BOARD - 8], [rx, D, H - BOARD - 8]]));

  // Top cover (front face) with an embossed lighter panel.
  parts.push(poly(C.coverTop, [[0, 0, H], [W, 0, H], [W, D, H], [0, D, H]], soft(C.coverTop, 10)));
  parts.push(poly(C.coverPanel, [[28, 28, H], [W - 28, 28, H], [W - 28, D - 28, H], [28, D - 28, H]], soft(C.coverPanel, 14)));

  return parts.join("\n");
}

function pencil() {
  // Lies on the cover along +x, slightly off-centre, hanging past the fore-edge.
  const y0 = 135;
  const t = 24; // thickness
  const x0 = -34;
  const x1 = W + 8; // where the wood tip starts
  const z0 = H;
  const z1 = H + t;
  const parts = [];
  // Shadow on the cover.
  parts.push(poly(C.shadow, [[x0 + 10, y0 + t, z0], [x1 + 44, y0 + t, z0], [x1 + 44, y0 + t + 22, z0], [x0 + 10, y0 + t + 22, z0]], soft(C.shadow, 8)));
  // Body: top face + down-left side face.
  parts.push(poly(C.pencil, [[x0, y0, z1], [x1, y0, z1], [x1, y0 + t, z1], [x0, y0 + t, z1]]));
  parts.push(poly(C.pencilSide, [[x0, y0 + t, z0], [x1, y0 + t, z0], [x1, y0 + t, z1], [x0, y0 + t, z1]]));
  // Metal band and eraser at the back end.
  parts.push(poly(C.band, [[x0, y0, z1], [x0 + 16, y0, z1], [x0 + 16, y0 + t, z1], [x0, y0 + t, z1]]));
  parts.push(poly(C.bandDark, [[x0, y0 + t, z0], [x0 + 16, y0 + t, z0], [x0 + 16, y0 + t, z1], [x0, y0 + t, z1]]));
  parts.push(poly(C.eraser, [[x0 - 18, y0, z1], [x0, y0, z1], [x0, y0 + t, z1], [x0 - 18, y0 + t, z1]]));
  parts.push(poly(C.eraserDark, [[x0 - 18, y0 + t, z0], [x0, y0 + t, z0], [x0, y0 + t, z1], [x0 - 18, y0 + t, z1]]));
  parts.push(poly(C.eraserDark, [[x0 - 18, y0, z0], [x0 - 18, y0 + t, z0], [x0 - 18, y0 + t, z1], [x0 - 18, y0, z1]]));
  // Wood tip: two faces converging to the lead point, then the lead.
  const tip = [x1 + 46, y0 + t / 2, (z0 + z1) / 2];
  parts.push(poly(C.wood, [[x1, y0, z1], [x1, y0 + t, z1], tip]));
  parts.push(poly(C.woodDark, [[x1, y0 + t, z1], [x1, y0 + t, z0], tip]));
  parts.push(poly(C.lead, [[x1 + 32, y0 + 4, z1 - 4], [x1 + 32, y0 + t - 3, z1 - 3], tip]));
  parts.push(poly(C.leadDark, [[x1 + 32, y0 + t - 3, z1 - 3], [x1 + 32, y0 + t - 3, z0 + 3], tip]));
  return parts.join("\n");
}

/** @param {{ rounded: boolean, scale?: number }} o */
function svg({ rounded, scale = 1 }) {
  const radius = rounded ? 112 : 0;
  const c = S / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <rect width="${S}" height="${S}" rx="${radius}" fill="${BG}"/>
  <g transform="translate(${c} ${c}) scale(${scale}) translate(${-c} ${-c})">
${book()}
${pencil()}
  </g>
</svg>`;
}

const render = (opts, size) =>
  sharp(Buffer.from(svg(opts)), { density: 288 }).resize(size, size).png().toBuffer();

const rounded = { rounded: true };
const bleed = { rounded: false };

await writeFile(out("public/icons/icon-192.png"), await render({ ...rounded, scale: 0.92 }, 192));
await writeFile(out("public/icons/icon-512.png"), await render({ ...rounded, scale: 0.92 }, 512));
await writeFile(out("public/icons/icon-512-maskable.png"), await render({ ...bleed, scale: 0.76 }, 512));
await writeFile(out("src/app/apple-icon.png"), await render({ ...bleed, scale: 0.92 }, 180));
await writeFile(out("src/app/icon.png"), await render({ ...rounded, scale: 0.92 }, 64));
console.log("icons written");
