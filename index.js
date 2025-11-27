// index.js
// Node.js-Script zum Erzeugen eines Organigramms (SVG + PNG) aus der PostgreSQL-Tabelle "roles"

const fs = require("fs");
const { Client } = require("pg");
const sharp = require("sharp");

// ---------- 1. Datenbank-Verbindung ----------
// Passe diese Werte an deine Umgebung an
const client = new Client({
  host: process.env.PGHOST || "localhost",
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER || "postgres",      // ggf. ändern
  password: process.env.PGPASSWORD || "", // ggf. ändern
  database: process.env.PGDATABASE || "kirche" // ggf. ändern
});

// ---------- 2. Rollen aus DB laden ----------

async function loadRoles() {
  await client.connect();
  const res = await client.query(
    "SELECT id, name, parent_id FROM roles ORDER BY id ASC"
  );
  await client.end();
  return res.rows;
}

// ---------- 3. Baum-Struktur bauen ----------

function buildTree(roles) {
  const byId = new Map();
  roles.forEach((r) => {
    byId.set(r.id, { ...r, children: [] });
  });

  let root = null;

  byId.forEach((node) => {
    if (node.parent_id == null) {
      root = node;
    } else {
      const parent = byId.get(node.parent_id);
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  return { root, byId };
}

// ---------- 4. einfache Layout-Berechnung ----------

function layoutTree(root) {
  const positions = new Map();
  let currentX = 0;

  function assignPositions(node, depth) {
    if (!node.children || node.children.length === 0) {
      // Blatt
      positions.set(node.id, { x: currentX, y: depth });
      currentX++;
    } else {
      node.children.forEach((child) => assignPositions(child, depth + 1));
      const xs = node.children.map((c) => positions.get(c.id).x);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      positions.set(node.id, { x: (minX + maxX) / 2, y: depth });
    }
  }

  assignPositions(root, 0);

  return positions;
}

// ---------- 5. SVG erzeugen ----------

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function generateSvg(roles, positions) {
  const nodeWidth = 140;
  const nodeHeight = 40;
  const levelHeight = 100;
  const nodeSpacingX = 160;
  const margin = 40;

  const xs = [];
  const ys = [];

  positions.forEach((pos) => {
    xs.push(pos.x);
    ys.push(pos.y);
  });

  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  const width = (maxX + 1) * nodeSpacingX + margin * 2;
  const height = (maxY + 1) * levelHeight + margin * 2;

  const rects = [];
  const lines = [];

  const byId = new Map();
  roles.forEach((r) => byId.set(r.id, r));

  // Linien
  roles.forEach((role) => {
    if (role.parent_id != null) {
      const parentPos = positions.get(role.parent_id);
      const childPos = positions.get(role.id);

      const parentX =
        margin + parentPos.x * nodeSpacingX + nodeWidth / 2;
      const parentY =
        margin + parentPos.y * levelHeight + nodeHeight;
      const childX =
        margin + childPos.x * nodeSpacingX + nodeWidth / 2;
      const childY =
        margin + childPos.y * levelHeight;

      lines.push(
        `<line x1="${parentX}" y1="${parentY}" x2="${childX}" y2="${childY}" stroke="black" stroke-width="2" />`
      );
    }
  });

  // Knoten
  roles.forEach((role) => {
    const pos = positions.get(role.id);
    const x = margin + pos.x * nodeSpacingX;
    const y = margin + pos.y * levelHeight;

    rects.push(
      `<rect x="${x}" y="${y}" width="${nodeWidth}" height="${nodeHeight}" rx="10" ry="10" fill="white" stroke="black" stroke-width="2" />`
    );

    const textX = x + nodeWidth / 2;
    const textY = y + nodeHeight / 2 + 5;
    rects.push(
      `<text x="${textX}" y="${textY}" font-family="Arial" font-size="14" text-anchor="middle" alignment-baseline="middle">${escapeXml(
        role.name
      )}</text>`
    );
  });

  const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <style>
    text { dominant-baseline: middle; }
  </style>
  ${lines.join("\n  ")}
  ${rects.join("\n  ")}
</svg>
  `.trim();

  return svgContent;
}

// ---------- 6. SVG speichern + PNG erzeugen ----------

async function saveGraphics(svgContent) {
  const svgFile = "kirche.svg";
  const pngFile = "kirche.png";

  fs.writeFileSync(svgFile, svgContent, "utf8");
  console.log(`SVG gespeichert als ${svgFile}`);

  await sharp(Buffer.from(svgContent)).png().toFile(pngFile);
  console.log(`PNG gespeichert als ${pngFile}`);
}

// ---------- 7. main ----------

async function main() {
  try {
    console.log("Verbinde zu PostgreSQL und lade Rollen...");
    const roles = await loadRoles();

    if (roles.length === 0) {
      console.error("Keine Rollen gefunden. Hast du schema.sql in die DB importiert?");
      process.exit(1);
    }

    const { root } = buildTree(roles);
    if (!root) {
      console.error("Kein Root-Knoten (Papst) gefunden.");
      process.exit(1);
    }

    const positions = layoutTree(root);
    const svgContent = generateSvg(roles, positions);
    await saveGraphics(svgContent);

    console.log("Fertig! Organigramm wurde erzeugt.");
  } catch (err) {
    console.error("Fehler:", err);
    process.exit(1);
  }
}

main();
