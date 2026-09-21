import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import { Workbook } from "@oai/artifact-tool";

const baseCsv = execFileSync("git", ["show", "HEAD:restaurants.csv"], { encoding: "utf8" });
const workbook = await Workbook.fromCSV(baseCsv, { sheetName: "Restaurants" });
const sheet = workbook.worksheets.getItem("Restaurants");
const values = sheet.getUsedRange().values;
const headers = values[0];
const nameIndex = headers.indexOf("name");
const idIndex = headers.indexOf("id");
const categoryIndex = headers.indexOf("category");
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
    if (row[nameIndex] !== "CHAGEE") return next;
    next[idIndex] = correctedId;
    next[nameIndex] = correctedName;
    next[detailsIndex] = correctedDetails;
    next[notesIndex] = `${next[notesIndex]} User-verified correction: HI TEA EVERYDAY was a duplicate of this branch.`;
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

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const csv = `${headers.join(",")}\n${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
const check = await Workbook.fromCSV(csv, { sheetName: "Restaurants" });
check.recalculate();
const inspection = await check.inspect({ kind: "region", sheetId: "Restaurants", range: `A1:K${rows.length + 1}`, maxChars: 1800 });
if (!inspection || rows.length !== 115) throw new Error(`Expected 115 rows, found ${rows.length}.`);

await fs.writeFile(new URL("../restaurants.csv", import.meta.url), csv, "utf8");
console.log(JSON.stringify({ total: rows.length, corrected: correctedName, removed: "HI TEA EVERYDAY" }, null, 2));
