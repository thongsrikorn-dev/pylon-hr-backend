# 🚀 คู่มือ Deploy PYLON HR Backend
## ขั้นตอนทีละขั้น - ทำได้เลย!

---

## ขั้นที่ 1: สมัคร Railway (ฟรี)

1. เปิด https://railway.app
2. กด **Sign Up with GitHub**
3. เข้าสู่ระบบ GitHub แล้วอนุมัติ

---

## ขั้นที่ 2: อัปโหลดโค้ดขึ้น GitHub

```
1. สร้าง Repository ใหม่ชื่อ "pylon-hr-backend"
2. อัปโหลดไฟล์ทั้งหมดใน folder pylon-backend/ นี้
   (package.json, src/ ทั้งหมด)
```

**ไฟล์ที่ต้องอัปโหลด:**
```
pylon-hr-backend/
├── package.json
├── src/
│   ├── server.js
│   ├── db/
│   │   ├── pool.js
│   │   ├── migrate.js
│   │   └── seed.js
│   ├── middleware/
│   │   └── auth.js
│   └── routes/
│       ├── auth.js
│       ├── employees.js
│       ├── evaluations.js
│       └── users.js
```

---

## ขั้นที่ 3: สร้าง Project บน Railway

1. เข้า https://railway.app/dashboard
2. กด **New Project**
3. เลือก **Deploy from GitHub repo**
4. เลือก repository `pylon-hr-backend`
5. Railway จะ deploy อัตโนมัติ

---

## ขั้นที่ 4: เพิ่ม PostgreSQL Database

1. ใน Project ที่เพิ่งสร้าง กด **+ Add Service**
2. เลือก **Database → PostgreSQL**
3. รอสักครู่ให้ database สร้างเสร็จ

---

## ขั้นที่ 5: ตั้งค่า Environment Variables

1. คลิกที่ Service (ไม่ใช่ Database)
2. ไปที่แท็บ **Variables**
3. เพิ่มตัวแปรเหล่านี้:

```
DATABASE_URL    = (คัดลอกจาก PostgreSQL service → Variables → DATABASE_URL)
JWT_SECRET      = pylon_secret_key_2024_change_this
PORT            = 3000
FRONTEND_URL    = https://thongsrikorn-dev.github.io
NODE_ENV        = production
```

---

## ขั้นที่ 6: รัน Migration และ Seed

1. ใน Railway ไปที่ Service → **Deploy** tab
2. กด **New Deployment** หรือใช้ Railway CLI:

```bash
# ติดตั้ง Railway CLI (ทำครั้งเดียว)
npm install -g @railway/cli

# Login
railway login

# เลือก project
railway link

# รัน migration (สร้างตาราง)
railway run node src/db/migrate.js

# รัน seed (ใส่ข้อมูลพนักงาน)
railway run node src/db/seed.js
```

หรือเพิ่มใน package.json แล้วรันผ่าน Railway Deploy Hooks

---

## ขั้นที่ 7: หา URL ของ Backend

1. ใน Railway ไปที่ Service → **Settings**
2. ดูที่ **Domains** → Copy URL เช่น `https://pylon-hr-backend-production.up.railway.app`

---

## ขั้นที่ 8: แก้ไข HTML และ pylon-api.js

เปิดไฟล์ `pylon-api.js` บรรทัดที่ 10:
```javascript
// เปลี่ยนจาก:
const PYLON_API_URL = 'https://YOUR-APP-NAME.railway.app';

// เป็น URL จริงจาก Railway:
const PYLON_API_URL = 'https://pylon-hr-backend-production.up.railway.app';
```

---

## ขั้นที่ 9: เพิ่ม pylon-api.js ใน HTML เดิม

เปิดไฟล์ `PYLON_HR_v8 (19).html` แล้วเพิ่มบรรทัดนี้ **ก่อน `</body>`**:

```html
<script src="pylon-api.js"></script>
</body>
```

---

## ขั้นที่ 10: อัปโหลดไฟล์กลับ GitHub Pages

อัปโหลดไฟล์ 2 ไฟล์ไปที่ Repository `Pylon_Hr.`:
- `PYLON_HR_v8 (19).html` (เวอร์ชันที่แก้แล้ว)
- `pylon-api.js` (ไฟล์ใหม่)

---

## ✅ ทดสอบ

เปิด https://thongsrikorn-dev.github.io/Pylon_Hr./PYLON_HR_v8%20(19).html

ลอง Login ด้วย:
- **admin / admin123** (ผู้ดูแลระบบ)
- **exec / exec123** (ฝ่ายบริหาร)
- **รหัสพนักงาน + วันเกิด DDMMYYYY** (พนักงาน)

---

## 🔧 ปัญหาที่พบบ่อย

| ปัญหา | วิธีแก้ |
|-------|---------|
| Login ไม่ได้ | ตรวจสอบ DATABASE_URL และ JWT_SECRET |
| CORS Error | เพิ่ม FRONTEND_URL ใน Railway Variables |
| Database Error | รัน migrate.js ก่อน seed.js |
| 404 Error | ตรวจ URL ใน pylon-api.js |

---

## 📞 Health Check

ทดสอบ API โดยเปิด browser:
```
https://YOUR-URL.railway.app/health
```
ต้องได้ผลลัพธ์: `{"status":"OK","database":"connected"}`

---

*หากมีปัญหาตรงไหน ถ่ายรูปหน้าจอส่งมาได้เลยครับ*
