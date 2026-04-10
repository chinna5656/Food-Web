import Link from "next/link";

export default function Home() {
  return (
    <div className="section-space">
      <section className="hero">
        <article className="hero-panel">
          <span className="badge good">Production Health Platform</span>
          <h1 className="hero-title page-heading">
            ระบบโภชนาการอาหาร + คำนวณแคลอรี่ + วางแผนเมนูผู้ป่วยเบาหวานครบในเว็บเดียว
          </h1>
          <p className="hero-copy">
            GlucoPlate ออกแบบมาเพื่อใช้งานจริงในระดับ production รองรับสมาชิกแต่ละคน,
            การคำนวณแคลอรี่รายบุคคล, ค้นหาโภชนาการอาหาร, สร้างแผนอาหารสำหรับผู้ป่วยเบาหวาน
            และบันทึกแคลอรี่รายวันแบบติดตามย้อนหลังได้
          </p>
          <div className="hero-actions">
            <Link href="/signup" className="btn btn-primary">
              เริ่มสมัครสมาชิก
            </Link>
            <Link href="/dashboard" className="btn btn-ghost">
              ไปที่แดชบอร์ด
            </Link>
          </div>
        </article>

        <aside className="hero-panel stat-wrap" aria-label="Platform summary">
          <div className="stat-pill">
            <strong>Nutrition Intelligence</strong>
            ฐานข้อมูลอาหารพร้อมคาร์บ โปรตีน ไขมัน ไฟเบอร์ และระดับเหมาะสมกับผู้ป่วยเบาหวาน
          </div>
          <div className="stat-pill">
            <strong>Calorie Personalization</strong>
            คำนวณ BMR/TDEE ด้วยสูตรมาตรฐาน เพื่อให้ได้แคลอรี่เป้าหมายที่ควบคุมได้จริง
          </div>
          <div className="stat-pill">
            <strong>Daily Logging</strong>
            บันทึกการกินรายวัน รายมื้อ และตรวจสอบยอดแคลอรี่สะสมได้ทันที
          </div>
        </aside>
      </section>

      <section className="section-space">
        <h2 className="section-title">ฟีเจอร์หลักที่พร้อมใช้งาน</h2>
        <div className="grid-3">
          <article className="card">
            <h3>แสดงค่าโภชนาการอาหาร</h3>
            <p>ค้นหาอาหารได้รวดเร็ว พร้อมรายละเอียดแคลอรี่ คาร์บ โปรตีน ไขมัน และไฟเบอร์</p>
            <div className="section-space">
              <Link href="/nutrition" className="btn btn-ghost">
                เปิดหน้าค้นหาอาหาร
              </Link>
            </div>
          </article>

          <article className="card">
            <h3>คำนวณแคลอรี่รายบุคคล</h3>
            <p>กรอกอายุ เพศ น้ำหนัก ส่วนสูง และกิจกรรมประจำวัน ระบบจะคำนวณเป้าหมายอัตโนมัติ</p>
            <div className="section-space">
              <Link href="/calculator" className="btn btn-ghost">
                เริ่มคำนวณ
              </Link>
            </div>
          </article>

          <article className="card">
            <h3>สร้างอาหารสำหรับผู้ป่วยเบาหวาน</h3>
            <p>สร้างแผนเมนูรายวันตามงบแคลอรี่และสัดส่วนคาร์บที่เหมาะสม พร้อมใช้งานได้ทันที</p>
            <div className="section-space">
              <Link href="/meal-planner" className="btn btn-ghost">
                สร้างแผนอาหาร
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="section-space">
        <h2 className="section-title">ออกแบบเพื่อการใช้งานระดับ Production</h2>
        <div className="grid-2">
          <article className="card">
            <h3>ระบบสมาชิกและความปลอดภัย</h3>
            <p>
              รองรับการสมัครสมาชิก เข้าสู่ระบบ เก็บ session ผ่าน HttpOnly Cookie และ hash
              รหัสผ่านก่อนจัดเก็บ
            </p>
          </article>
          <article className="card">
            <h3>จัดเก็บข้อมูลแคลอรี่รายวัน</h3>
            <p>
              ข้อมูลบันทึกแต่ละมื้อถูกแยกตามวัน ช่วยติดตามผลและวิเคราะห์พฤติกรรมการกินอย่างต่อเนื่อง
            </p>
          </article>
        </div>
      </section>

      <section className="section-space">
        <article className="card">
          <span className="badge good">New</span>
          <h3 className="section-space">แชทบอทให้คำแนะนำ/คำปรึกษาโภชนาการ</h3>
          <p>
            พูดคุยกับผู้ช่วยโภชนาการเพื่อรับคำแนะนำเฉพาะบุคคลจากข้อมูลที่คุณบันทึกในระบบ เช่น
            แคลอรี่วันนี้เกินไหม ควรปรับมื้อถัดไปอย่างไร หรือควรเลือกของว่างแบบไหน
          </p>
          <div className="section-space">
            <Link href="/chat" className="btn btn-secondary">
              เปิดแชทที่ปรึกษา
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
