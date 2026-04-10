# GlucoPlate

เว็บแอปโภชนาการสำหรับผู้ป่วยเบาหวาน รองรับการคำนวณแคลอรี่ วางแผนอาหาร บันทึกแคลอรี่รายวัน และแชทบอทให้คำแนะนำแบบเฉพาะบุคคล

## ฟีเจอร์หลัก

- ระบบสมาชิก สมัครสมาชิก/เข้าสู่ระบบ/ออกจากระบบ
- คำนวณแคลอรี่รายบุคคล (BMR/TDEE)
- ค้นหาโภชนาการอาหาร
- สร้างแผนอาหารสำหรับผู้ป่วยเบาหวาน
- บันทึกแคลอรี่รายวัน
- แชทบอทคำแนะนำโภชนาการ พร้อมลบข้อความรายรายการและล้างประวัติแชท

## Backend Architecture

โค้ดฝั่ง backend แยกเป็นชั้นเพื่อดูแลง่ายขึ้น

- `app/api/*`: route handler แบบบาง ทำหน้าที่รับ request/ส่ง response
- `lib/backend/*.service.ts`: business logic ของแต่ละโดเมน (auth, logs, profile, chat, ฯลฯ)
- `lib/backend/errors.ts`: นิยาม error มาตรฐาน (`BackendError`)
- `lib/backend/response.ts`: แปลง error เป็น HTTP response อย่างสม่ำเสมอ
- `lib/backend/summary.ts`: utility กลางสำหรับสรุปโภชนาการ

รูปแบบการไหลของงานโดยรวม:

```text
HTTP Request -> app/api/*/route.ts -> lib/backend/*.service.ts -> Prisma/lib domain helpers -> HTTP Response
```

## Quick Start

1. ติดตั้งแพ็กเกจ

```bash
npm install
```

1. ตั้งค่า Environment

```bash
copy .env.example .env
```

หากต้องการใช้ AI จริงในแชทบอท ให้ตั้งค่าเพิ่มใน `.env`

```env
OPENAI_API_KEY=your_real_key
OPENAI_MODEL=gpt-4.1-mini
OPENAI_API_BASE_URL=https://api.openai.com/v1
```

1. เตรียมฐานข้อมูล

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

1. รันเซิร์ฟเวอร์

```bash
npm run dev
```

เปิดใช้งานที่ [http://localhost:3000](http://localhost:3000)

## เอกสารโปรเจกต์

- คู่มือภาษาไทย: [PROJECT_GUIDE_TH.md](./PROJECT_GUIDE_TH.md)

## Debug และตรวจคุณภาพ

```bash
npm run lint
npm run build
```

## Troubleshooting

### เข้าแชทไม่ได้

ตรวจสอบตามลำดับนี้

1. ล็อกอินก่อน แล้วเปิดหน้า `/chat` หรือ `/advisor`
2. หากหน้าไม่ขึ้น ให้รีสตาร์ต dev server ให้เหลือ instance เดียว
3. รัน `npm run db:push` เพื่ออัปเดต schema ล่าสุด
4. ตรวจสอบ API `/api/chat/advisor` ว่าตอบกลับปกติ
5. ถ้าต้องการให้ตอบด้วย AI ให้ตั้งค่า `OPENAI_API_KEY` ให้ถูกต้อง

### แชทตอบเหมือน rule-based ไม่ใช่ AI

1. ตรวจสอบว่ามี `OPENAI_API_KEY` ในไฟล์ `.env`
2. ตรวจสอบ network ออกอินเทอร์เน็ตได้จากเครื่องที่รัน backend
3. เปิดดู response จาก `POST /api/chat/advisor` ว่าฟิลด์ `engine` เป็น `ai` หรือ `rule-based`

### มีข้อความว่า Another next dev server is already running

ให้ปิด process เก่าก่อน แล้วรันใหม่

```bash
taskkill /PID <PID> /F
npm run dev
```

## หมายเหตุ

โปรเจกต์นี้ใช้ Next.js 16 + Prisma + SQLite และออกแบบให้ deploy ได้จริงระดับ production โดยควรเปลี่ยนฐานข้อมูลเป็น PostgreSQL หรือ MySQL เมื่อใช้งานจริงที่ scale สูง
