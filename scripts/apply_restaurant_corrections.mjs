import crypto from "node:crypto";
import fs from "node:fs/promises";
import { Workbook } from "@oai/artifact-tool";

const baseCsv = await fs.readFile(new URL("../restaurants.csv", import.meta.url), "utf8");
const workbook = await Workbook.fromCSV(baseCsv, { sheetName: "Restaurants" });
const sheet = workbook.worksheets.getItem("Restaurants");
const values = sheet.getUsedRange().values;
const headers = values[0];
const nameIndex = headers.indexOf("name");
const idIndex = headers.indexOf("id");
const categoryIndex = headers.indexOf("category");
const statusIndex = headers.indexOf("status");
const detailsIndex = headers.indexOf("details_url");
const imageIndex = headers.indexOf("image_url");
const imageSourceIndex = headers.indexOf("image_source");
const referenceIndex = headers.indexOf("reference_url");
const notesIndex = headers.indexOf("notes");

const correctedName = "CHAGEE Seacon Bangkae";
const correctedId = `chagee-seacon-bangkae-${crypto.createHash("sha1").update(`${correctedName}|1`).digest("hex").slice(0, 8)}`;
const correctedDetails = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(correctedName)}`;
const beverageCategory = "เครื่องดื่มและคาเฟ่";
const beverageNames = new Set(["BEARHOUSE", "FUKU MATCHA", "MIXUE", "Inthanin", "YODCHA", "Kita Tea Stand"]);
const bakeryCategory = "ขนมและเบเกอรี";
const bakeryNames = new Set(["Bun", "Dunkin", "โดเช่ (Dolce Gelatino)"]);
const tamTamUrl = "https://www.wongnai.com/restaurants/146789IE-%E0%B8%95%E0%B8%B3%E0%B8%95%E0%B8%B3-%E0%B8%8B%E0%B8%B5%E0%B8%84%E0%B8%AD%E0%B8%99-%E0%B8%9A%E0%B8%B2%E0%B8%87%E0%B9%81%E0%B8%84";
const tamTamImage = "https://thanakritdacontact-tech.github.io/seacon-bangkae-food-picker/assets/tamtam-wongnai.jpg";
const mungkornbinUrl = "https://maps.app.goo.gl/DhRgaPBapmjbCw7aA";
const mungkornbinImage = "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWk1XUg2RIe5HQIup0_IsvxiLIvqy5ScFTEtfbP775y7szcROmOE4eQrk-V9-MRo4hgpL7WwSU6pgadL6fMxxxDfeW8Zl_iEewT3_6gHRlHpYp8vyqGE-2E8h1Y81jedvWqI8neHe3rDWVfs=w408-h544-k-no";
const dairyQueenUrl = "https://maps.app.goo.gl/8a5VN76oJT6SmFBF6";
const reviewedSources = new Map([
  ["shop-3e71049b", { url: "https://maps.app.goo.gl/mzFZvAK3MmrsiNCaA", source: "google-maps" }],
  ["chester-s-c8b9d9ee", { url: "https://maps.app.goo.gl/BaTgoCrRuimhL57Z7", source: "google-maps" }],
  ["gaga-9ad035f1", { url: "https://maps.app.goo.gl/X7Q56H6okajPQV2y9", source: "google-maps" }],
  ["paris-mikki-3d1acce8", { url: "https://maps.app.goo.gl/7okdAkphxBKbpw6FA", source: "google-maps" }],
  ["yakiniku-like-0f79bff1", { url: "https://maps.app.goo.gl/EbMFurtF1PE7GaoPA", source: "google-maps" }],
  ["auntieanne-s-bb7a7ed2", { url: "https://maps.app.goo.gl/UPD9THVjL9fzMmPu8", source: "google-maps" }],
  ["mamemi-2af37ab5", { url: "https://www.brandbuffet.in.th/2022/08/mamemi-soymilk-cafe-seacon-bangkae/", source: "alternative" }],
  ["mister-donut-7f937408", { url: "https://maps.app.goo.gl/hGVX6MX33ayMBz1T6", source: "google-maps" }],
  ["saint-croissant-703c4a63", { url: "https://maps.app.goo.gl/DHVcPAetpDsbZ8qCA", source: "google-maps" }],
  ["aka-3c1a2bc0", { url: "https://maps.app.goo.gl/abGnV2eKyNxKmSLQA", source: "google-maps" }],
  ["kari-kori-ee0ac51c", { url: "https://www.punpro.com/p/Seacon-bangkae-all-the-restaurants-2024", source: "alternative" }],
  ["max-beef-eece3cdb", { url: "https://www.wongnai.com/chains/maxbeef-buffet", source: "alternative" }],
  ["santa-fe-steak-5e4cd2bf", { url: "https://maps.app.goo.gl/L7EFrgMtrZRLbAyr5", source: "google-maps" }],
  ["shop-770e9e5e", { url: "https://www.thaifranchisecenter.com/directory/detail.php?fcID=f000004008", source: "alternative" }],
  ["shop-6ae938cd", { url: "https://www.patois.com/shop/86301-", source: "alternative" }],
  ["shop-343c424f", { url: "https://patois.com/shop/89564-%E0%B9%84%E0%B8%AE%E0%B9%82%E0%B8%8B-%E0%B9%82%E0%B8%A3%E0%B8%95%E0%B8%B5%E0%B8%8A%E0%B8%B2%E0%B8%8A%E0%B8%B1%E0%B8%81-%E0%B8%AA%E0%B8%B2%E0%B8%82%E0%B8%B2%E0%B8%8B%E0%B8%B5%E0%B8%84%E0%B8%AD%E0%B8%99-%E0%B8%9A%E0%B8%B2%E0%B8%87%E0%B9%81%E0%B8%84", source: "alternative" }],
  ["cha-king-95b4852e", { url: "https://maps.app.goo.gl/4NPGsVY11gSopB5o6", source: "google-maps" }],
  ["chester-s-da727596", { url: "https://maps.app.goo.gl/PA9dhqsb9q4bU25Q7", source: "google-maps" }],
  ["dakasi-25e24941", { url: "https://salehere.co.th/dakasi/branches/seacon-bangkae", source: "alternative" }],
  ["gateaux-house-0bec58e5", { url: "https://maps.app.goo.gl/9bwXJUeVGJCYtbSE8", source: "google-maps" }],
  ["grainey-c9d61286", { url: "https://grainey.com/soft-cookie-shop/", source: "alternative" }],
  ["in-love-salad-f9d51e59", { url: "https://www.wongnai.com/restaurants/1443863yC-in-love-salad-seacon-bangkae", source: "alternative" }],
  ["spread-cheese-burger-67c182b4", { url: "https://maps.app.goo.gl/RU7wh2y8b5isGb2e7", source: "google-maps" }],
  ["yamazaki-a123a229", { url: "https://maps.app.goo.gl/XTNmFKHeXzXJrUGt9", source: "google-maps" }],
]);

const rows = values.slice(1)
  .filter((row) => !["HI TEA EVERYDAY", "MUJI"].includes(row[nameIndex]))
  .map((row) => {
    const next = [...row];
    if (next[categoryIndex] === "เครื่องดื่ม" || beverageNames.has(next[nameIndex])) next[categoryIndex] = beverageCategory;
    if (bakeryNames.has(next[nameIndex])) next[categoryIndex] = bakeryCategory;
    if (next[nameIndex] === "ตำตำ") {
      next[detailsIndex] = tamTamUrl;
      next[imageIndex] = tamTamImage;
      next[imageSourceIndex] = "review";
      next[referenceIndex] = tamTamUrl;
      next[notesIndex] = "User-provided Wongnai branch page confirms Seacon Bangkae floor 4; local card image copied from that page because its image host blocks hotlinking; updated 2026-09-21.";
    }
    if (next[nameIndex] === "Mungkornbin") {
      next[detailsIndex] = mungkornbinUrl;
      next[imageIndex] = mungkornbinImage;
      next[imageSourceIndex] = "google-maps";
      next[referenceIndex] = mungkornbinUrl;
      next[notesIndex] = "User-provided Google Maps listing matches มังกรบินคาเฟ่ Mongoornbin; card image sourced from that listing; updated 2026-09-21.";
    }
    if (next[nameIndex] === "Dairy Queen") {
      next[statusIndex] = "active";
      next[detailsIndex] = dairyQueenUrl;
      next[referenceIndex] = dairyQueenUrl;
      next[notesIndex] = "User-provided Google Maps listing confirms Dairy Queen at Seacon Bangkae and identifies counters on B1 and floor 4; retained the existing B-floor directory record; updated 2026-09-21.";
    }
    const reviewedSource = reviewedSources.get(next[idIndex]);
    if (reviewedSource) {
      next[statusIndex] = "active";
      next[detailsIndex] = reviewedSource.url;
      next[referenceIndex] = reviewedSource.url;
      next[notesIndex] = reviewedSource.source === "google-maps"
        ? "User reviewed this branch as active; exact Google Maps share link verified 2026-09-21."
        : "User reviewed this branch as active; Google Maps was conflicting or ambiguous, so an exact alternative branch source is used; verified 2026-09-21.";
    }
    if (row[nameIndex] !== "CHAGEE") return next;
    next[idIndex] = correctedId;
    next[nameIndex] = correctedName;
    next[detailsIndex] = correctedDetails;
    if (!next[notesIndex].includes("User-verified correction")) next[notesIndex] = `${next[notesIndex]} User-verified correction: HI TEA EVERYDAY was a duplicate of this branch.`;
    return next;
  });

if (rows.filter((row) => row[nameIndex] === correctedName).length !== 1) throw new Error("Expected one corrected CHAGEE row.");
if (rows.some((row) => row[nameIndex] === "HI TEA EVERYDAY")) throw new Error("HI TEA EVERYDAY was not removed.");
if (rows.some((row) => row[nameIndex] === "MUJI")) throw new Error("MUJI was not removed.");
if (rows.some((row) => row[categoryIndex] === "เครื่องดื่ม")) throw new Error("Legacy beverage category was not merged.");
if ([...beverageNames].some((name) => !rows.some((row) => row[nameIndex] === name && row[categoryIndex] === beverageCategory))) {
  throw new Error("One or more beverage category corrections were not applied.");
}
if ([...bakeryNames].some((name) => !rows.some((row) => row[nameIndex] === name && row[categoryIndex] === bakeryCategory))) {
  throw new Error("One or more bakery category corrections were not applied.");
}
if (!rows.some((row) => row[nameIndex] === "ตำตำ" && row[detailsIndex] === tamTamUrl && row[imageIndex] === tamTamImage)) throw new Error("ตำตำ source correction was not applied.");
if (!rows.some((row) => row[nameIndex] === "Mungkornbin" && row[detailsIndex] === mungkornbinUrl && row[imageIndex] === mungkornbinImage)) throw new Error("Mungkornbin source correction was not applied.");
if (!rows.some((row) => row[nameIndex] === "Dairy Queen" && row[statusIndex] === "active" && row[detailsIndex] === dairyQueenUrl)) throw new Error("Dairy Queen activation was not applied.");
if (rows.some((row) => row[statusIndex] === "needs-review")) throw new Error("A needs-review row remains after user verification.");
if ([...reviewedSources].some(([id, source]) => !rows.some((row) => row[idIndex] === id && row[statusIndex] === "active" && row[detailsIndex] === source.url))) throw new Error("One or more reviewed source corrections were not applied.");

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const csv = `${headers.join(",")}\n${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
const check = await Workbook.fromCSV(csv, { sheetName: "Restaurants" });
check.recalculate();
const inspection = await check.inspect({ kind: "region", sheetId: "Restaurants", range: `A1:K${rows.length + 1}`, maxChars: 1800 });
if (!inspection || rows.length !== 112) throw new Error(`Expected 112 rows, found ${rows.length}.`);

await fs.writeFile(new URL("../restaurants.csv", import.meta.url), csv, "utf8");
console.log(JSON.stringify({ total: rows.length, corrected: correctedName, removed: "HI TEA EVERYDAY" }, null, 2));
