# Seacon Bangkae Food Picker

เว็บค้นหา กรอง สุ่ม และหมุนวงล้อเลือกร้านอาหารที่ Seacon Bangkae กรุงเทพมหานคร รองรับมือถือ แท็บเล็ต เดสก์ท็อป คีย์บอร์ด และ `prefers-reduced-motion`

เว็บไซต์: https://thanakritdacontact-tech.github.io/seacon-bangkae-food-picker/

## ข้อมูลร้าน

ข้อมูลอัปเดต ณ วันที่ 21 กันยายน 2569 มีทั้งหมด 117 รายการ:

- Active 88 ร้าน แสดงบนเว็บไซต์
- Closed 1 ร้าน เก็บใน CSV แต่ไม่แสดงบนเว็บไซต์
- Needs review 28 ร้าน เก็บใน CSV แต่ไม่แสดงบนเว็บไซต์

`restaurants.csv` เป็น source of truth และเก็บชื่อ หมวดหมู่ โซน ชั้น สถานะ ลิงก์รายละเอียด รูป แหล่งรูป ลิงก์อ้างอิง และหมายเหตุไว้ครบ `mall-data.js` เป็นไฟล์ generated สำหรับ browser และไม่ควรแก้ด้วยมือ

แหล่งข้อมูลหลัก:

- [Punpro: รวมของกินกว่า 100 ร้าน ที่ซีคอน บางแค อัปเดตปี 2567](https://www.punpro.com/p/Seacon-bangkae-all-the-restaurants-2024)
- [Seacon Bangkae Shop Directory](https://seaconbangkae.com/shop)
- Google Maps ของแต่ละสาขา
- ประกาศและ social media ทางการของห้างหรือร้าน

ร้านจะเป็น `active` เมื่อมีหลักฐานปัจจุบันรองรับสาขาที่ห้างนี้, เป็น `closed` เฉพาะเมื่อมีแหล่งข้อมูลปัจจุบันระบุว่าปิด และเป็น `needs-review` เมื่อหา exact branch ไม่พบหรือหลักฐานขัดแย้งกัน

## พัฒนาและอัปเดตข้อมูล

ต้องใช้ Node.js 22+ และ Python 3:

```bash
python3 -m http.server 4173
```

เปิด http://127.0.0.1:4173

สร้างข้อมูล browser ใหม่จาก CSV:

```bash
python3 /path/to/mall-food-picker/scripts/build_data.py \
  --config mall-config.json \
  --restaurants restaurants.csv \
  --output mall-data.js
```

ทดสอบด้วย Playwright ขณะ server ทำงาน:

```bash
npm install
npm test
```
