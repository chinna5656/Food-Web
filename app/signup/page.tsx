"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type SignupForm = {
  name: string;
  email: string;
  password: string;
  diabetesType: "type1" | "type2" | "prediabetes" | "gestational" | "other";
};

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState<SignupForm>({
    name: "",
    email: "",
    password: "",
    diabetesType: "type2",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "สมัครสมาชิกไม่สำเร็จ");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-wrap section-space">
      <div className="form-panel">
        <h1 className="section-title">สมัครสมาชิก</h1>
        <p className="muted">
          สร้างบัญชีเพื่อคำนวณแคลอรี่เฉพาะบุคคล และบันทึกแคลอรี่รายวันของคุณ
        </p>

        <form className="section-space" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="name">ชื่อ-นามสกุล</label>
              <input
                id="name"
                value={form.name}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, name: event.target.value }))
                }
                placeholder="เช่น ณัฐพงษ์ ใจดี"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="email">อีเมล</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, email: event.target.value }))
                }
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">รหัสผ่าน</label>
              <input
                id="password"
                type="password"
                minLength={8}
                value={form.password}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, password: event.target.value }))
                }
                placeholder="อย่างน้อย 8 ตัวอักษร"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="diabetesType">ประเภทเบาหวาน (ถ้ามี)</label>
              <select
                id="diabetesType"
                value={form.diabetesType}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    diabetesType: event.target.value as SignupForm["diabetesType"],
                  }))
                }
              >
                <option value="type1">Type 1</option>
                <option value="type2">Type 2</option>
                <option value="prediabetes">Prediabetes</option>
                <option value="gestational">Gestational</option>
                <option value="other">Other / ไม่ระบุ</option>
              </select>
            </div>
          </div>

          <div className="inline-actions section-space">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
            </button>
            <Link href="/login" className="btn btn-ghost">
              มีบัญชีอยู่แล้ว
            </Link>
          </div>

          {error ? <p className="status error">{error}</p> : null}
        </form>
      </div>
    </section>
  );
}