import crypto from "node:crypto";
import fs from "node:fs/promises";
import { Workbook } from "@oai/artifact-tool";

const PUNPRO_URL = "https://www.punpro.com/p/Seacon-bangkae-all-the-restaurants-2024";
const OFFICIAL_DIRECTORY_URL = "https://seaconbangkae.com/shop";
const OFFICIAL_DATA_URL = "https://seaconbangkae.com/Shop/shopData?lang=th";
const OFFICIAL_2026_URL = "https://www.lemon8-app.com/@seaconplus_bangkae/7602836162918515201?region=th";
const CHECKED_ON = "2026-09-21";

const floors = [
  { heading: /<h3[^>]*>(?:(?!<\/h3>)[\s\S])*ชั้นใต้ดิน \(LB\)(?:(?!<\/h3>)[\s\S])*<\/h3>/i, floor: "B" },
  { heading: /<h3[^>]*>(?:(?!<\/h3>)[\s\S])*ชั้น 1 \(L1\)(?:(?!<\/h3>)[\s\S])*<\/h3>/i, floor: "1" },
  { heading: /<h3[^>]*>(?:(?!<\/h3>)[\s\S])*ชั้น 2 \(L2\)(?:(?!<\/h3>)[\s\S])*<\/h3>/i, floor: "2" },
  { heading: /<h3[^>]*>(?:(?!<\/h3>)[\s\S])*ชั้น 3 \(L3\)(?:(?!<\/h3>)[\s\S])*<\/h3>/i, floor: "3" },
  { heading: /<h3[^>]*>(?:(?!<\/h3>)[\s\S])*ชั้น 4 \(L4\)(?:(?!<\/h3>)[\s\S])*<\/h3>/i, floor: "4" },
];

const recentStores = [
  ["CHAGEE", "1", "เครื่องดื่มและคาเฟ่"],
  ["Mini Oriental Speedbar", "2", "เครื่องดื่มและคาเฟ่"],
  ["Rowie’s Coffee", "1", "เครื่องดื่มและคาเฟ่"],
  ["NAISNOW", "1", "เครื่องดื่มและคาเฟ่"],
  ["Italasia", "B", "เครื่องดื่มและคาเฟ่"],
  ["Baron's Bar", "B", "เครื่องดื่มและคาเฟ่"],
  ["SUSHi PLUS", "4", "อาหารญี่ปุ่น"],
  ["HI TEA EVERYDAY", "B", "เครื่องดื่ม"],
];

function decodeHtml(value) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&rsquo;|&lsquo;/g, "'")
    .replace(/&rdquo;|&ldquo;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeName(value) {
  return value
    .replace(/\s*\((?:อยู่ด้านหน้าห้าง|มีที่นั่ง|มีเฉพาะเบเกอรี่|กำลังรีโนเวท[^)]*|เตรียมเปิดร้านเร็ว\s*ๆ\s*นี้|[^)]*(?:เครื่องดื่ม|ขนม|คาเฟ่|ชานม|ข้าวแกงกะหรี่|น้ำแข็งไส|ไอศกรีม|ปิ้งย่าง|ซาลาเปา|บุฟเฟต์|สุกี้|ติ่มซำ|ไก่ทอด|คุกกี้|เต้าฮวย|นมถั่วเหลือง)[^)]*)\)\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stableId(name, floor) {
  const prefix = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 28) || "shop";
  return `${prefix}-${crypto.createHash("sha1").update(`${name}|${floor}`).digest("hex").slice(0, 8)}`;
}

function categoryFor(name, original) {
  const text = `${name} ${original}`.toLowerCase();
  if (/ชา|coffee|cafe|กาแฟ|boost|dakasi|koi|gaga|amazon|starbucks|เครื่องดื่ม|yoguruto|yogurt|mr\.jolly|baron's/.test(text)) return "เครื่องดื่มและคาเฟ่";
  if (/sushi|ซูชิ|fuji|ramen|ราเมน|yotori|shinkanzen|sato|ซาโต|oishi|yayoi|sukiya|ฮะจิบัง|แกงกะหรี่|japanese/.test(text)) return "อาหารญี่ปุ่น";
  if (/shabu|ชาบู|suki|สุกี้|mk|neo|mandarin|นางพญา/.test(text)) return "ชาบูและสุกี้";
  if (/yakiniku|bar b q|aka|max beef|myeongryun|ปิ้งย่าง|เนื้อแท้/.test(text)) return "ปิ้งย่างและเนื้อ";
  if (/bonchon|gugu|chester|kfc|mcdonald|pizza|burger|pepper|santa fe|sizzler|eat am are/.test(text)) return "อาหารจานด่วนและตะวันตก";
  if (/dairy queen|swensen|gelato|ice|ไอศกรีม|น้ำแข็งไส|cake|bakery|bake|bread|pancake|donut|croissant|yamazaki|bonjour|gateaux|paris mikki|amor|โรตี|ขนม|หวาน|หยกสด|ดาหลา/.test(text)) return "ขนมและเบเกอรี";
  if (/dookki|bonchon|gugu|myeongryun|เกาหลี/.test(text)) return "อาหารเกาหลี";
  if (/สลัด|organic|โอ้กะจู๋|สุขภาพ/.test(text)) return "สุขภาพ";
  return "อาหารไทยและนานาชาติ";
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows) {
  const headers = ["id", "name", "category", "location", "floor", "status", "details_url", "image_url", "image_source", "reference_url", "notes"];
  return `${headers.join(",")}\n${rows.map((row) => headers.map((key) => csvCell(row[key])).join(",")).join("\n")}\n`;
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (compatible; SeaconBangkaeFoodPicker/1.0)" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

function extractPunproRows(html) {
  const rows = [];
  for (let i = 0; i < floors.length; i += 1) {
    const current = floors[i];
    const startMatch = html.match(current.heading);
    if (!startMatch) throw new Error(`Punpro section not found for floor ${current.floor}`);
    const start = startMatch.index;
    const end = i + 1 < floors.length ? html.slice(start + 1).search(floors[i + 1].heading) + start + 1 : html.length;
    const section = html.slice(start, end > start ? end : html.length);
    const list = section.match(/<ol>([\s\S]*?)<\/ol>/i)?.[1];
    if (!list) throw new Error(`Punpro list not found for floor ${current.floor}`);
    for (const item of list.matchAll(/<li>([\s\S]*?)<\/li>/gi)) {
      const original = decodeHtml(item[1]);
      const name = normalizeName(original);
      if (!name) continue;
      rows.push({ name, original, floor: current.floor });
    }
  }
  return rows;
}

async function mapsEvidence(name) {
  const query = `${name} Seacon Bangkae`;
  const detailsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  try {
    const shell = await fetchText(detailsUrl);
    const endpointMatch = shell.match(/href="([^\"]*tbm=map[^\"]*)"/i);
    if (!endpointMatch) return { status: "needs-review", detailsUrl, imageUrl: "", note: "Google Maps did not return a readable exact-branch result." };
    const endpoint = `https://www.google.com${endpointMatch[1].replaceAll("&amp;", "&")}`;
    const raw = await fetchText(endpoint);
    const decoded = raw.replaceAll("\\u003d", "=").replaceAll("\\u0026", "&").replaceAll("\\/", "/");
    const exactMall = /ซีคอน บางแค|Seacon Bangkae|607 ถ\. เพชรเกษม|607 Phetkasem/i.test(decoded);
    const hasHours = /เปิดเวลา|ปิดเวลา|เปิดอยู่|ปิดอยู่|Open ·|Closed ·/i.test(decoded);
    const explicitClosed = /ปิดถาวร|Permanently closed/i.test(decoded);
    const imageCandidates = [...decoded.matchAll(/https:\/\/(?:streetviewpixels-pa|lh3)\.googleusercontent\.com\/[^"]+/gi)].map((match) => match[0].replace(/\\+$/, ""));
    const imageUrl = imageCandidates.find((url) => url.includes("streetviewpixels-pa"))
      || imageCandidates.find((url) => !url.includes("/a-/") && /=w(?:408|211|152|122)-h/.test(url))
      || imageCandidates.find((url) => !url.includes("/a-/"))
      || "";
    if (explicitClosed && exactMall) return { status: "closed", detailsUrl, imageUrl, note: `Google Maps marks the exact Seacon Bangkae branch permanently closed; checked ${CHECKED_ON}.` };
    if (exactMall && hasHours) return { status: "active", detailsUrl, imageUrl, note: `Google Maps matched the Seacon Bangkae branch and displayed current hours; checked ${CHECKED_ON}.` };
    return { status: "needs-review", detailsUrl, imageUrl, note: `Google Maps evidence was absent or ambiguous for the exact mall branch; checked ${CHECKED_ON}.` };
  } catch (error) {
    return { status: "needs-review", detailsUrl, imageUrl: "", note: `Google Maps check failed (${error.message}); checked ${CHECKED_ON}.` };
  }
}

async function mapWithConcurrency(items, limit, task) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

const [punproHtml, officialShops] = await Promise.all([
  fetchText(PUNPRO_URL),
  fetchText(OFFICIAL_DATA_URL).then(JSON.parse),
]);

const baseline = extractPunproRows(punproHtml);
const deduped = new Map(baseline.map((row) => [`${row.name.toLowerCase()}|${row.floor}`, row]));
for (const [name, floor, category] of recentStores) {
  const key = `${name.toLowerCase()}|${floor}`;
  if (!deduped.has(key)) deduped.set(key, { name, original: name, floor, recentCategory: category, officialRecent: true });
}

const candidates = [...deduped.values()];
const evidence = await mapWithConcurrency(candidates, 6, (row) => mapsEvidence(row.name));
const officialByName = new Map(officialShops.map((shop) => [shop.name.trim().toLowerCase(), shop]));

const rows = candidates.map((row, index) => {
  const maps = evidence[index];
  const official = officialByName.get(row.name.trim().toLowerCase());
  const location = /ด้านหน้าห้าง/.test(row.original) ? "หน้าศูนย์การค้า" : row.floor === "B" ? "ชั้นใต้ดิน" : "อาคารหลัก";
  let status = maps.status;
  let referenceUrl = maps.detailsUrl;
  let notes = maps.note;
  if (row.officialRecent) {
    status = "active";
    referenceUrl = OFFICIAL_2026_URL;
    notes = `Official Seacon Plus 2026 update names this branch on floor ${row.floor}; Maps ${maps.status}; checked ${CHECKED_ON}.`;
  } else if (official) {
    status = "active";
    referenceUrl = `${OFFICIAL_DIRECTORY_URL}/${official.slug}`;
    notes = `Current official mall directory lists this branch on floor ${official.floor}; Maps ${maps.status}; checked ${CHECKED_ON}.`;
  } else if (status === "needs-review") {
    referenceUrl = PUNPRO_URL;
    notes = `${notes} Retained from Punpro's 2024 floor list for follow-up.`;
  }
  const officialImage = official?.images?.thumbnail ? `https://seaconbangkae.com/${official.images.thumbnail.split("/").map(encodeURIComponent).join("/")}` : "";
  const imageUrl = officialImage || maps.imageUrl;
  return {
    id: stableId(row.name, row.floor),
    name: row.name,
    category: row.recentCategory || categoryFor(row.name, row.original),
    location,
    floor: row.floor,
    status,
    details_url: maps.detailsUrl,
    image_url: imageUrl,
    image_source: officialImage ? "official" : imageUrl ? "google-maps" : "none",
    reference_url: referenceUrl,
    notes,
  };
}).sort((a, b) => a.floor.localeCompare(b.floor, undefined, { numeric: true }) || a.name.localeCompare(b.name, "th"));

const csv = toCsv(rows);
const workbook = await Workbook.fromCSV(csv, { sheetName: "Restaurants" });
const inspection = await workbook.inspect({ kind: "region", sheetId: "Restaurants", range: `A1:K${rows.length + 1}`, maxChars: 2500 });
if (!inspection || rows.length < 100) throw new Error(`Spreadsheet validation failed; only ${rows.length} rows found.`);
if (new Set(rows.map((row) => row.id)).size !== rows.length) throw new Error("Duplicate restaurant IDs found.");
if (rows.some((row) => !["active", "closed", "needs-review"].includes(row.status))) throw new Error("Invalid status found.");

await fs.writeFile(new URL("../restaurants.csv", import.meta.url), csv, "utf8");
const summary = Object.fromEntries(["active", "closed", "needs-review"].map((status) => [status, rows.filter((row) => row.status === status).length]));
console.log(JSON.stringify({ total: rows.length, ...summary }, null, 2));
