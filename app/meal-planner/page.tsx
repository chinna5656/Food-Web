"use client";

import { FormEvent, useState } from "react";

type MealPlanResponse = {
  message: string;
  dailyCalories: number;
  meals: Array<{
    slot: string;
    label: string;
    targetCalories: number;
    targetCarbs: number;
    food: {
      id: string;
      nameThai: string;
      nameEnglish: string;
      serving: string;
      calories: number;
      carbsG: number;
      proteinG: number;
      fatG: number;
      fiberG: number;
    };
  }>;
  totals: {
    calories: number;
    carbsG: number;
    proteinG: number;
    fatG: number;
    fiberG: number;
  };
};

export default function MealPlannerPage() {
  const [dailyCalories, setDailyCalories] = useState("");
  const [mealsPerDay, setMealsPerDay] = useState("4");
  const [excludeTags, setExcludeTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<MealPlanResponse | null>(null);
  const includeSnack = mealsPerDay === "4";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/meal-plans/diabetes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyCalories: dailyCalories ? Number(dailyCalories) : undefined,
          mealsPerDay: Number(mealsPerDay),
          includeSnack,
          excludeTags: excludeTags
            .split(",")
            .map((tag) => tag.trim().toLowerCase())
            .filter(Boolean),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "ไม่สามารถสร้างแผนอาหารได้");
      }

      setPlan(data as MealPlanResponse);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section-space">
      <h1 className="section-title">สร้างแผนอาหารสำหรับผู้ป่วยเบาหวาน</h1>
      <div className="info-box">
        📋 ระบบจะเลือกเมนูที่เหมาะสมตามแคลอรี่เป้าหมาย และคุมสัดส่วนคาร์บให้สมดุลในแต่ละมื้อ
      </div>
      <p className="muted section-space">
        กรอกข้อมูลด้านล่าง ระบบจะสร้างแผนอาหารรายวันให้คุณ
      </p>

      <form className="form-panel section-space" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="dailyCalories">แคลอรี่เป้าหมายต่อวัน (ถ้าไม่กรอกจะใช้ค่าล่าสุด)</label>
            <input
              id="dailyCalories"
              type="number"
              min={1200}
              max={4000}
              value={dailyCalories}
              onChange={(event) => setDailyCalories(event.target.value)}
              placeholder="เช่น 1800"
            />
          </div>

          <div className="field">
            <label>จำนวนมื้อต่อวัน</label>
            <div className="checkbox-field">
              <input
                type="radio"
                id="meals3"
                name="mealsPerDay"
                value="3"
                checked={mealsPerDay === "3"}
                onChange={(event) => setMealsPerDay(event.target.value)}
              />
              <label htmlFor="meals3">3 มื้อหลัก เท่านั้น</label>
            </div>
            <div className="checkbox-field">
              <input
                type="radio"
                id="meals4"
                name="mealsPerDay"
                value="4"
                checked={mealsPerDay === "4"}
                onChange={(event) => setMealsPerDay(event.target.value)}
              />
              <label htmlFor="meals4">3 มื้อหลัก + 1 มื้อว่าง</label>
            </div>
          </div>

          <div className="field">
            <label htmlFor="excludeTags">แท็กที่ต้องการหลีกเลี่ยง (คั่นด้วย , )</label>
            <input
              id="excludeTags"
              value={excludeTags}
              onChange={(event) => setExcludeTags(event.target.value)}
              placeholder="เช่น spicy, seafood, high-carb"
            />
          </div>
        </div>

        <div className="inline-actions section-space">
          <button type="submit" className="btn btn-secondary" disabled={loading}>
            {loading ? "กำลังสร้างแผน..." : "สร้างแผนอาหารเบาหวาน"}
          </button>
        </div>

        {error ? <p className="status error">{error}</p> : null}
      </form>

      {plan ? (
        <section className="section-space">
          <article className="card">
            <h3>แผนอาหารรายวัน ({plan.dailyCalories.toLocaleString()} kcal)</h3>
            <p className="muted">
              รวมจริง: {plan.totals.calories.toLocaleString()} kcal | คาร์บ {plan.totals.carbsG} g | โปรตีน{" "}
              {plan.totals.proteinG} g | ไขมัน {plan.totals.fatG} g | ไฟเบอร์ {plan.totals.fiberG} g
            </p>
          </article>

          <div className="grid-2 section-space">
            {plan.meals.map((meal) => (
              <article className="card" key={meal.slot}>
                <h3>{meal.label}</h3>
                <p>
                  เป้าหมายมื้อนี้: {meal.targetCalories} kcal / คาร์บ {meal.targetCarbs} g
                </p>
                <p>
                  เมนู: <strong>{meal.food.nameThai}</strong> ({meal.food.nameEnglish})
                </p>
                <p>หน่วยบริโภค: {meal.food.serving}</p>
                <p>
                  {meal.food.calories} kcal | C {meal.food.carbsG} g | P {meal.food.proteinG} g | F{" "}
                  {meal.food.fatG} g | Fiber {meal.food.fiberG} g
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
