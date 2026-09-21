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
const notesIndex = headers.indexOf("notes");

const correctedName = "CHAGEE Seacon Bangkae";
const correctedId = `chagee-seacon-bangkae-${crypto.createHash("sha1").update(`${correctedName}|1`).digest("hex").slice(0, 8)}`;
const correctedDetails = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(correctedName)}`;
const beverageCategory = "เครื่องดื่มและคาเฟ่";

const rows = values.slice(1)
  .filter((row) => row[nameIndex] !== "HI TEA EVERYDAY")
  .map((row) => {
    const next = [...row];
    if (next[categoryIndex] === "เครื่องดื่ม" || next[nameIndex] === "BEARHOUSE") next[categoryIndex] = beverageCategory;
    if (row[nameIndex] !== "CHAGEE") return next;
    next[idIndex] = correctedId;
    next[nameIndex] = correctedName;
    next[detailsIndex] = correctedDetails;
    next[notesIndex] = `${next[notesIndex]} User-verified correction: HI TEA EVERYDAY was a duplicate of this branch.`;
    return next;
  });

if (rows.filter((row) => row[nameIndex] === correctedName).length !== 1) throw new Error("Expected one corrected CHAGEE row.");
if (rows.some((row) => row[nameIndex] === "HI TEA EVERYDAY")) throw new Error("HI TEA EVERYDAY was not removed.");
if (rows.some((row) => row[categoryIndex] === "เครื่องดื่ม")) throw new Error("Legacy beverage category was not merged.");
if (!rows.some((row) => row[nameIndex] === "BEARHOUSE" && row[categoryIndex] === beverageCategory)) {
  throw new Error("BEARHOUSE category correction was not applied.");
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const csv = `${headers.join(",")}\n${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
const check = await Workbook.fromCSV(csv, { sheetName: "Restaurants" });
check.recalculate();
const inspection = await check.inspect({ kind: "region", sheetId: "Restaurants", range: `A1:K${rows.length + 1}`, maxChars: 1800 });
if (!inspection || rows.length !== 116) throw new Error(`Expected 116 rows, found ${rows.length}.`);

await fs.writeFile(new URL("../restaurants.csv", import.meta.url), csv, "utf8");
console.log(JSON.stringify({ total: rows.length, corrected: correctedName, removed: "HI TEA EVERYDAY" }, null, 2));
