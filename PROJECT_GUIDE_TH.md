# เอกสารอธิบายโปรเจกต์ (ภาษาไทย)

## 1) ภาพรวมโปรเจกต์

โปรเจกต์นี้เป็นเว็บแอปสำหรับงานโภชนาการและการควบคุมแคลอรี่ โดยเน้นผู้ป่วยเบาหวาน

ฟีเจอร์หลัก:

- แสดงข้อมูลโภชนาการอาหาร
- คำนวณแคลอรี่รายบุคคล (BMR/TDEE)
- สร้างแผนอาหารสำหรับผู้ป่วยเบาหวาน
- ระบบสมัครสมาชิก / เข้าสู่ระบบ
- บันทึกแคลอรี่รายวันและดูสรุปย้อนหลังตามวันที่
- แชทบอทให้คำแนะนำแบบเฉพาะบุคคล พร้อมลบข้อความและล้างประวัติ

## 2) เทคโนโลยีที่ใช้

- Frontend/Backend: Next.js (App Router) + React + TypeScript
- Database ORM: Prisma
- Database (ปัจจุบัน): SQLite
- Validation: Zod
- Auth/Security: bcryptjs + JWT (jose) + HttpOnly Cookie

## 3) ข้อมูลถูกบันทึกไว้ที่ไหน

### 3.1 Database URL

กำหนดในไฟล์ `.env`

- `DATABASE_URL="file:./dev.db"`

เมื่อใช้ Prisma กับ schema ในโฟลเดอร์ `prisma/` ไฟล์ฐานข้อมูลจะอยู่ที่:

- `prisma/dev.db`

### 3.2 โครงสร้างตารางหลัก

กำหนดใน `prisma/schema.prisma`

- `User`: เก็บข้อมูลสมาชิก
- `FoodCatalog`: คลังข้อมูลอาหารและโภชนาการ
- `CalorieLog`: บันทึกการกินรายวันของผู้ใช้
- `UserTarget`: เป้าหมายแคลอรี่/แมโครของผู้ใช้
- `ChatMessage`: ประวัติแชทของผู้ใช้ (role/content/timestamp)

### 3.3 ข้อมูลอาหารตั้งต้น (Seed)

- ชุดข้อมูลตั้งต้นอยู่ที่ `lib/food-catalog.ts`
- คำสั่ง seed อยู่ที่ `prisma/seed.ts`
- รันด้วยคำสั่ง `npm run db:seed`

### 3.4 Session / Token

- ใช้คุกกี้ชื่อ `wf_token` (HttpOnly)
- ตั้งค่าใน `lib/config.ts` และใช้งานผ่าน `lib/auth.ts`

## 4) ฟังก์ชันและ API ที่มี

หมายเหตุเชิงสถาปัตยกรรม:

- ทุก endpoint ใน `app/api/*` ใช้รูปแบบ route handler แบบบาง
- business logic ถูกย้ายไปไว้ที่ `lib/backend/*.service.ts`
- การจัดการ error ใช้มาตรฐานเดียวผ่าน `lib/backend/errors.ts` และ `lib/backend/response.ts`

## 4.1 Authentication

- `POST /api/auth/register`
  - สมัครสมาชิกใหม่
- `POST /api/auth/login`
  - เข้าสู่ระบบ
- `POST /api/auth/logout`
  - ออกจากระบบ

## 4.2 Profile และ Dashboard

- `GET /api/profile?date=YYYY-MM-DD`
  - ดึงข้อมูลผู้ใช้, เป้าหมายล่าสุด, และสรุปแคลอรี่ของวันที่เลือก

## 4.3 อาหารและโภชนาการ

- `GET /api/foods/search`
  - ค้นหาอาหารจากคำค้น/หมวด/ตัวกรองผู้ป่วยเบาหวาน
  - ตัวอย่าง query: `q`, `category`, `diabetesFriendly`, `limit`

## 4.4 คำนวณแคลอรี่

- `POST /api/calorie/target`
  - คำนวณ BMR/TDEE และบันทึกเป้าหมายรายวัน

## 4.5 แผนอาหารผู้ป่วยเบาหวาน

- `POST /api/meal-plans/diabetes`
  - สร้าง meal plan รายวันตามแคลอรี่เป้าหมาย

## 4.6 บันทึกแคลอรี่รายวัน

- `GET /api/logs?date=YYYY-MM-DD`
  - ดูรายการและสรุปของวันนั้น
- `POST /api/logs`
  - เพิ่มรายการบันทึกอาหาร/แคลอรี่
- `DELETE /api/logs?id=LOG_ID`
  - ลบรายการบันทึก

## 4.7 แชทบอทคำปรึกษา

- `GET /api/chat/advisor`
  - โหลดบริบทผู้ใช้และประวัติแชท
  - ส่งค่าการตั้งค่า AI กลับใน `ai.enabled`
- `POST /api/chat/advisor`
  - ส่งข้อความเพื่อรับคำแนะนำ โดยอ้างอิงประวัติย้อนหลังหลายข้อความ
  - ฝั่ง backend จะพยายามเรียก AI ก่อน และ fallback เป็น rule-based อัตโนมัติเมื่อ AI ใช้ไม่ได้
  - ส่งค่า engine กลับเป็น `ai` หรือ `rule-based`
- `DELETE /api/chat/advisor?id=MESSAGE_ID`
  - ลบข้อความรายรายการ
- `DELETE /api/chat/advisor?all=true`
  - ล้างประวัติแชททั้งหมดของผู้ใช้

### โครง backend สำหรับ AI

- `lib/ai-advisor.ts`
  - จัดการเรียก API ของ AI provider จากฝั่งเซิร์ฟเวอร์เท่านั้น
  - รับ context ผู้ใช้ + history และสร้าง prompt เพื่อให้ตอบแบบเฉพาะบุคคล
- `lib/backend/chat.service.ts`
  - เป็นจุดรวม business logic ของแชททั้งหมด (load/send/delete/clear)
  - เก็บข้อความลงฐานข้อมูลผ่าน `ChatMessage`
  - เลือกใช้ AI ก่อน และ fallback เป็น rule-based โดยอัตโนมัติ
- `app/api/chat/advisor/route.ts`
  - ทำหน้าที่เป็น controller บาง เรียกใช้ chat service และคืนผลลัพธ์เป็น HTTP response
  - ซ่อนคีย์ API ไว้หลังบ้าน ไม่ส่งไป frontend

## 5) หน้าเว็บหลัก

- `/` หน้าแรก (ภาพรวมระบบ)
- `/signup` สมัครสมาชิก
- `/login` เข้าสู่ระบบ
- `/dashboard` สรุปและบันทึกแคลอรี่รายวัน
- `/nutrition` ค้นหาข้อมูลโภชนาการอาหาร
- `/calculator` คำนวณแคลอรี่รายบุคคล
- `/meal-planner` สร้างแผนอาหารผู้ป่วยเบาหวาน
- `/chat` หน้าแชทหลัก (alias ไป `/advisor`)
- `/advisor` หน้าแชทบอทคำแนะนำ

## 6) โครงสร้างไฟล์สำคัญ

- `app/api/...` API Routes ทั้งหมด (controller layer)
- `app/...` หน้าเว็บ
- `lib/backend/auth.service.ts` business logic การสมัครสมาชิก/เข้าสู่ระบบ
- `lib/backend/profile.service.ts` โหลดข้อมูลโปรไฟล์และสรุปรายวัน
- `lib/backend/foods.service.ts` ค้นหาและกรองข้อมูลโภชนาการ
- `lib/backend/calorie.service.ts` คำนวณและบันทึกเป้าหมายแคลอรี่
- `lib/backend/meal-plan.service.ts` สร้างแผนอาหารสำหรับผู้ป่วยเบาหวาน
- `lib/backend/logs.service.ts` เพิ่ม/ลบ/ดูบันทึกแคลอรี่รายวัน
- `lib/backend/chat.service.ts` จัดการประวัติแชทและตอบคำแนะนำ
- `lib/backend/errors.ts` นิยาม error แบบมี status code
- `lib/backend/response.ts` helper ส่ง error response แบบมาตรฐาน
- `lib/backend/summary.ts` utility รวมสำหรับสรุปแคลอรี่/สารอาหาร
- `lib/auth.ts` logic auth/token/hash ระดับ utility
- `lib/calorie.ts` สูตรคำนวณแคลอรี่เชิงโดเมน
- `lib/meal-planner.ts` logic สร้างแผนอาหารเชิงโดเมน
- `lib/chat-advisor.ts` rule-based advisor logic
- `lib/ai-advisor.ts` integration กับ AI provider
- `lib/validators.ts` schema validation
- `prisma/schema.prisma` โครงสร้างฐานข้อมูล
- `prisma/seed.ts` seed ข้อมูลอาหาร
- `proxy.ts` route protection (หน้า private/public)

## 7) การรันโปรเจกต์

### 7.1 ติดตั้ง dependencies

- `npm install`

### 7.2 เตรียมฐานข้อมูล

- `npm run db:generate`
- `npm run db:push`
- `npm run db:seed`

### 7.3 รันโหมดพัฒนา

- `npm run dev`

### 7.4 ตรวจคุณภาพก่อนขึ้น production

- `npm run lint`
- `npm run build`
- `npm run start`

## 8) Environment Variables ที่ต้องมี

ตัวอย่างอยู่ใน `.env.example`

- `DATABASE_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY` (ไม่บังคับ แต่ต้องมีหากต้องการตอบด้วย AI)
- `OPENAI_MODEL` (เช่น `gpt-4.1-mini`)
- `OPENAI_API_BASE_URL` (ค่าเริ่มต้น `https://api.openai.com/v1`)

แนะนำ production:

- เปลี่ยน `JWT_SECRET` เป็นค่ายาวอย่างน้อย 32 ตัวอักษร
- เปลี่ยนฐานข้อมูลจาก SQLite ไป PostgreSQL/MySQL เมื่อมีผู้ใช้จำนวนมาก
- ตั้งค่าการสำรองข้อมูล (backup) และ monitoring

## 9) Troubleshooting ที่พบบ่อย

### เข้าแชทไม่ได้

1. ต้องล็อกอินก่อน
2. เปิดผ่าน `/chat` หรือ `/advisor`
3. ถ้าเจอ redirect วน ให้ล้างคุกกี้แล้วล็อกอินใหม่
4. ถ้าพึ่งดึงโค้ดใหม่ให้รัน `npm run db:push`

### แชทไม่ตอบแบบ AI

1. ตรวจสอบ `OPENAI_API_KEY` ในไฟล์ `.env`
2. ตรวจสอบว่า backend ออกอินเทอร์เน็ตได้
3. ตรวจ response จาก `POST /api/chat/advisor` ว่า `engine` เป็น `ai`
4. ถ้า `engine` เป็น `rule-based` หมายถึงระบบ fallback ทำงานแทน AI

### Another next dev server is already running

- ปิดตัวเดิมด้วย `taskkill /PID <PID> /F`
- เปิดใหม่ด้วย `npm run dev`

### Prisma EPERM ตอน generate/push บน Windows

- ปิด dev server ชั่วคราว แล้วรันคำสั่ง Prisma ใหม่
- ถ้ายังไม่หาย ให้ปิด terminal/session ที่ค้างอยู่ก่อน

## 10) หมายเหตุเชิง Production

- ปัจจุบันใช้งานได้ครบตามฟีเจอร์หลัก
- ถ้าจะขึ้น production จริงควรเพิ่ม:
  - Rate limit สำหรับ API สำคัญ (login/register)
  - Logging/Tracing แบบรวมศูนย์
  - Error monitoring (เช่น Sentry)
  - CI/CD และการทดสอบอัตโนมัติ
