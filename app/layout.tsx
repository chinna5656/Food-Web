import type { Metadata } from "next";
import { Bricolage_Grotesque, Sarabun } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "GlucoPlate | โภชนาการและแคลอรี่สำหรับผู้ป่วยเบาหวาน",
  description:
    "แพลตฟอร์มคำนวณแคลอรี่ แสดงโภชนาการอาหาร วางแผนอาหารผู้ป่วยเบาหวาน พร้อมระบบสมาชิกและบันทึกแคลอรี่รายวัน",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${sarabun.variable} ${bricolage.variable}`}>
      <body>
        <a href="#content" className="skip-link">
          ข้ามไปเนื้อหาหลัก
        </a>
        <header className="site-header">
          <div className="container nav-shell">
            <Link href="/" className="brand-mark">
              GlucoPlate
            </Link>
            <nav className="nav-links" aria-label="Main Navigation">
              <Link href="/nutrition">โภชนาการอาหาร</Link>
              <Link href="/calculator">คำนวณแคลอรี่</Link>
              <Link href="/meal-planner">แผนอาหารเบาหวาน</Link>
              <Link href="/chat">แชทที่ปรึกษา</Link>
              <Link href="/dashboard">แดชบอร์ด</Link>
              <Link href="/login">เข้าสู่ระบบ</Link>
              <Link href="/signup" className="nav-cta">
                สมัครสมาชิก
              </Link>
            </nav>
          </div>
        </header>
        <main id="content" className="main-shell container">
          {children}
        </main>
        <footer className="site-footer">
          <div className="container footer-shell">
            <p>GlucoPlate Production Blueprint - 2026</p>
            <p>โฟกัสผู้ป่วยเบาหวาน: ควบคุมน้ำตาลด้วยข้อมูลโภชนาการที่ชัดเจน</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
