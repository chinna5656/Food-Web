# GlucoPlate

เว็บแอปโภชนาการสำหรับผู้ป่วยเบาหวาน รองรับการคำนวณแคลอรี่ วางแผนอาหาร บันทึกแคลอรี่รายวัน และแชทบอทให้คำแนะนำแบบเฉพาะบุคคล

## ฟีเจอร์หลัก

- ระบบสมาชิก สมัครสมาชิก/เข้าสู่ระบบ/ออกจากระบบ
- คำนวณแคลอรี่รายบุคคล (BMR/TDEE)
- ค้นหาโภชนาการอาหาร
- สร้างแผนอาหารสำหรับผู้ป่วยเบาหวาน
- บันทึกแคลอรี่รายวัน
- แชทบอทคำแนะนำโภชนาการ พร้อมลบข้อความรายรายการและล้างประวัติแชท

## Quick Start

1. ติดตั้งแพ็กเกจ

```bash
npm install
```

1. ตั้งค่า Environment

```bash
copy .env.example .env
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

### มีข้อความว่า Another next dev server is already running

ให้ปิด process เก่าก่อน แล้วรันใหม่

```bash
taskkill /PID <PID> /F
npm run dev
```

## หมายเหตุ

โปรเจกต์นี้ใช้ Next.js 16 + Prisma + SQLite และออกแบบให้ deploy ได้จริงระดับ production โดยควรเปลี่ยนฐานข้อมูลเป็น PostgreSQL หรือ MySQL เมื่อใช้งานจริงที่ scale สูง
"# Food-Web" 
"# Food-Web" 
