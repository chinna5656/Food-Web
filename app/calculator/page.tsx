"use client";

import { FormEvent, useState } from "react";

type CalculatorForm = {
  age: string;
  sex: "male" | "female";
  weightKg: string;
  heightCm: string;
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very-active";
  goal: "maintain" | "lose" | "gain";
};

type TargetResult = {
  bmr: number;
  tdee: number;
  dailyCalories: number;
  macros: {
    carbsG: number;
    proteinG: number;
    fatG: number;
  };
  calorieRange: {
    lower: number;
    upper: number;
  };
};

export default function CalorieCalculatorPage() {
  const [form, setForm] = useState<CalculatorForm>({
    age: "35",
    sex: "female",
    weightKg: "65",
    heightCm: "165",
    activityLevel: "moderate",
    goal: "maintain",
  });
  const [result, setResult] = useState<TargetResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/calorie/target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: Number(form.age),
          sex: form.sex,
          weightKg: Number(form.weightKg),
          heightCm: Number(form.heightCm),
          activityLevel: form.activityLevel,
          goal: form.goal,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "คำนวณแคลอรี่ไม่สำเร็จ");
      }

      setResult(data.target as TargetResult);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="section-space">
      <h1 className="section-title">คำนวณแคลอรี่รายบุคคล</h1>
      <p className="muted">
        ใช้สูตร BMR/TDEE เพื่อได้แคลอรี่เป้าหมายและสัดส่วนสารอาหารที่เหมาะกับการควบคุมเบาหวาน
      </p>

      <form className="form-panel section-space" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="age">อายุ</label>
            <input
              id="age"
              type="number"
              min={15}
              max={90}
              value={form.age}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, age: event.target.value }))
              }
              required
            />
          </div>

          <div className="field">
            <label htmlFor="sex">เพศ</label>
            <select
              id="sex"
              value={form.sex}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  sex: event.target.value as CalculatorForm["sex"],
                }))
              }
            >
              <option value="female">หญิง</option>
              <option value="male">ชาย</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="weightKg">น้ำหนัก (กก.)</label>
            <input
              id="weightKg"
              type="number"
              min={30}
              max={250}
              value={form.weightKg}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, weightKg: event.target.value }))
              }
              required
            />
          </div>

          <div className="field">
            <label htmlFor="heightCm">ส่วนสูง (ซม.)</label>
            <input
              id="heightCm"
              type="number"
              min={120}
              max={230}
              value={form.heightCm}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, heightCm: event.target.value }))
              }
              required
            />
          </div>

          <div className="field">
            <label htmlFor="activityLevel">ระดับกิจกรรม</label>
            <select
              id="activityLevel"
              value={form.activityLevel}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  activityLevel: event.target.value as CalculatorForm["activityLevel"],
                }))
              }
            >
              <option value="sedentary">นั่งทำงานเป็นหลัก</option>
              <option value="light">ออกกำลังเบา 1-3 วัน/สัปดาห์</option>
              <option value="moderate">ออกกำลังปานกลาง 3-5 วัน/สัปดาห์</option>
              <option value="active">กิจกรรมหนัก 6-7 วัน/สัปดาห์</option>
              <option value="very-active">งานใช้แรงมาก/นักกีฬา</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="goal">เป้าหมาย</label>
            <select
              id="goal"
              value={form.goal}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  goal: event.target.value as CalculatorForm["goal"],
                }))
              }
            >
              <option value="maintain">คงน้ำหนัก</option>
              <option value="lose">ลดน้ำหนัก</option>
              <option value="gain">เพิ่มน้ำหนัก</option>
            </select>
          </div>
        </div>

        <div className="inline-actions section-space">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "กำลังคำนวณ..." : "คำนวณและบันทึกเป้าหมาย"}
          </button>
        </div>

        {error ? <p className="status error">{error}</p> : null}
      </form>

      {result ? (
        <div className="grid-2 section-space">
          <article className="card">
            <h3>ผลคำนวณพลังงาน</h3>
            <p>BMR: {result.bmr.toLocaleString()} kcal/day</p>
            <p>TDEE: {result.tdee.toLocaleString()} kcal/day</p>
            <p>
              เป้าหมายแคลอรี่: <strong>{result.dailyCalories.toLocaleString()} kcal/day</strong>
            </p>
            <p>
              ช่วงแนะนำ: {result.calorieRange.lower.toLocaleString()} -{" "}
              {result.calorieRange.upper.toLocaleString()} kcal/day
            </p>
          </article>

          <article className="card">
            <h3>สัดส่วนสารอาหารต่อวัน</h3>
            <p>คาร์บ: {result.macros.carbsG.toLocaleString()} กรัม</p>
            <p>โปรตีน: {result.macros.proteinG.toLocaleString()} กรัม</p>
            <p>ไขมัน: {result.macros.fatG.toLocaleString()} กรัม</p>
          </article>
        </div>
      ) : null}
    </section>
  );
}
