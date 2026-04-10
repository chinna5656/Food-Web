"use client";

import { FormEvent, useState } from "react";

type FoodItem = {
  id: string;
  nameThai: string;
  nameEnglish: string;
  serving: string;
  category: string;
  calories: number;
  carbsG: number;
  proteinG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  diabetesFriendly: boolean;
  tags: string;
};

export default function NutritionPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [diabetesFriendlyOnly, setDiabetesFriendlyOnly] = useState(true);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function searchFoods(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (category) params.set("category", category);
      params.set("diabetesFriendly", String(diabetesFriendlyOnly));
      params.set("limit", "50");

      const response = await fetch(`/api/foods/search?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "ค้นหาอาหารไม่สำเร็จ");
      }

      setFoods(data.foods as FoodItem[]);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section-space">
      <h1 className="section-title">แสดงค่าโภชนาการอาหาร</h1>
      <p className="muted">
        ค้นหาอาหารและดูโภชนาการรายรายการ เพื่อคุมแคลอรี่และคาร์บสำหรับผู้ป่วยเบาหวาน
      </p>

      <form className="form-panel section-space" onSubmit={searchFoods}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="query">คำค้นหาอาหาร</label>
            <input
              id="query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="เช่น ข้าวกล้อง, ส้มตำ, salmon"
            />
          </div>

          <div className="field">
            <label htmlFor="category">หมวดอาหาร</label>
            <select id="category" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">ทั้งหมด</option>
              <option value="breakfast">เช้า</option>
              <option value="lunch">กลางวัน</option>
              <option value="dinner">เย็น</option>
              <option value="snack">ของว่าง</option>
              <option value="drink">เครื่องดื่ม</option>
            </select>
          </div>
        </div>

        <div className="inline-actions section-space">
          <label className="checkbox-field" htmlFor="diabetesFriendlyOnly">
            <input
              id="diabetesFriendlyOnly"
              type="checkbox"
              checked={diabetesFriendlyOnly}
              onChange={(event) => setDiabetesFriendlyOnly(event.target.checked)}
            />
            เฉพาะเมนูที่เหมาะกับผู้ป่วยเบาหวาน
          </label>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "กำลังค้นหา..." : "ค้นหาโภชนาการ"}
          </button>
        </div>

        {error ? <p className="status error">{error}</p> : null}
      </form>

      <section className="section-space">
        {loading ? (
          <div className="empty-state">
            <div className="loading-spinner" style={{ marginRight: "0.5rem" }} />
            กำลังค้นหา...
          </div>
        ) : foods.length === 0 ? (
          <div className="empty-state">
            {query.trim() || category || diabetesFriendlyOnly
              ? "🔍 ไม่พบผลลัพธ์ ลองปรับเงื่อนไขการค้นหา"
              : "💡 กรอกคำค้นหาเพื่อเริ่มค้นหาเมนูอาหาร"}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table-mobile-friendly">
              <thead>
                <tr>
                  <th>เมนู</th>
                  <th>หน่วยบริโภค</th>
                  <th>แคลอรี่</th>
                  <th>คาร์บ</th>
                  <th>โปรตีน</th>
                  <th>ไขมัน</th>
                  <th>ไฟเบอร์</th>
                  <th>สถานะเบาหวาน</th>
                </tr>
              </thead>
              <tbody>
                {foods.map((food) => (
                  <tr key={food.id}>
                    <td data-label="เมนู">
                      <strong>{food.nameThai}</strong>
                      <div className="muted">{food.nameEnglish}</div>
                    </td>
                    <td data-label="หน่วยบริโภค">{food.serving}</td>
                    <td data-label="แคลอรี่">{Math.round(food.calories)} kcal</td>
                    <td data-label="คาร์บ">{food.carbsG.toFixed(1)} g</td>
                    <td data-label="โปรตีน">{food.proteinG.toFixed(1)} g</td>
                    <td data-label="ไขมัน">{food.fatG.toFixed(1)} g</td>
                    <td data-label="ไฟเบอร์">{food.fiberG.toFixed(1)} g</td>
                    <td data-label="สถานะเบาหวาน">
                      <span className={`badge ${food.diabetesFriendly ? "good" : "warn"}`}>
                        {food.diabetesFriendly ? "เหมาะสม" : "ควรจำกัด"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
