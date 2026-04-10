"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type DashboardPayload = {
  user: {
    id: string;
    name: string;
    email: string;
    diabetesType: string | null;
  };
  latestTarget: {
    dailyCalories: number;
    carbsG: number;
    proteinG: number;
    fatG: number;
    createdAt: string;
  } | null;
  today: {
    date: string;
    totals: {
      calories: number;
      carbsG: number;
      proteinG: number;
      fatG: number;
      fiberG: number;
    };
    logs: Array<{
      id: string;
      mealType: "breakfast" | "lunch" | "dinner" | "snack";
      foodName: string;
      serving: string | null;
      calories: number;
      carbsG: number;
      proteinG: number;
      fatG: number;
      fiberG: number;
      createdAt: string;
    }>;
  };
};

type FoodOption = {
  id: string;
  nameThai: string;
  serving: string;
  calories: number;
  carbsG: number;
  diabetesFriendly: boolean;
};

const mealLabel: Record<string, string> = {
  breakfast: "มื้อเช้า",
  lunch: "มื้อกลางวัน",
  dinner: "มื้อเย็น",
  snack: "มื้อว่าง",
};

const todayISO = new Date().toISOString().slice(0, 10);

export default function DashboardPage() {
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">(
    "breakfast"
  );
  const [servingMultiplier, setServingMultiplier] = useState("1");
  const [foodQuery, setFoodQuery] = useState("");
  const [foodOptions, setFoodOptions] = useState<FoodOption[]>([]);
  const [foodId, setFoodId] = useState("");
  const [foodSearching, setFoodSearching] = useState(false);
  const [logLoading, setLogLoading] = useState(false);

  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(
    null
  );

  const targetCalories = dashboard?.latestTarget?.dailyCalories ?? 0;
  const consumedCalories = dashboard?.today.totals.calories ?? 0;
  const remainingCalories = targetCalories > 0 ? targetCalories - consumedCalories : 0;

  const progressPercent = useMemo(() => {
    if (!targetCalories) {
      return 0;
    }

    return Math.min(200, Math.round((consumedCalories / targetCalories) * 100));
  }, [consumedCalories, targetCalories]);

  async function loadDashboard(dateText = selectedDate) {
    setLoadingDashboard(true);

    try {
      const response = await fetch(`/api/profile?date=${dateText}`);
      const data = await response.json();

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message ?? "โหลดข้อมูลแดชบอร์ดไม่สำเร็จ");
      }

      setDashboard(data as DashboardPayload);
    } catch (loadError) {
      setMessage({
        type: "error",
        text: loadError instanceof Error ? loadError.message : "เกิดข้อผิดพลาดในการโหลดแดชบอร์ด",
      });
    } finally {
      setLoadingDashboard(false);
    }
  }

  async function handleSearchFoods() {
    setMessage(null);
    setFoodSearching(true);

    try {
      const params = new URLSearchParams({
        q: foodQuery.trim(),
        diabetesFriendly: "true",
        limit: "20",
      });

      const response = await fetch(`/api/foods/search?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "ค้นหาอาหารไม่สำเร็จ");
      }

      setFoodOptions(data.foods as FoodOption[]);
      if ((data.foods as FoodOption[]).length > 0) {
        setFoodId((data.foods as FoodOption[])[0].id);
      }
    } catch (searchError) {
      setMessage({
        type: "error",
        text: searchError instanceof Error ? searchError.message : "เกิดข้อผิดพลาด",
      });
    } finally {
      setFoodSearching(false);
    }
  }

  async function handleAddLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!foodId) {
      setMessage({ type: "error", text: "กรุณาเลือกอาหารก่อนบันทึก" });
      return;
    }

    setLogLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          mealType,
          foodId,
          servingMultiplier: Number(servingMultiplier),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "บันทึกแคลอรี่ไม่สำเร็จ");
      }

      setMessage({ type: "success", text: "บันทึกแคลอรี่เรียบร้อย" });
      await loadDashboard(selectedDate);
    } catch (saveError) {
      setMessage({
        type: "error",
        text: saveError instanceof Error ? saveError.message : "เกิดข้อผิดพลาด",
      });
    } finally {
      setLogLoading(false);
    }
  }

  async function handleDeleteLog(logId: string) {
    try {
      const response = await fetch(`/api/logs?id=${logId}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "ไม่สามารถลบบันทึกได้");
      }

      setMessage({ type: "success", text: "ลบบันทึกแล้ว" });
      await loadDashboard(selectedDate);
    } catch (deleteError) {
      setMessage({
        type: "error",
        text: deleteError instanceof Error ? deleteError.message : "เกิดข้อผิดพลาด",
      });
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  useEffect(() => {
    void loadDashboard(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  return (
    <section className="section-space">
      <div className="inline-actions">
        <h1 className="section-title">แดชบอร์ดบันทึกแคลอรี่รายวัน</h1>
        <button type="button" className="btn btn-ghost" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </div>

      {loadingDashboard ? (
        <p className="muted">
          <span className="loading-spinner" style={{ marginRight: "0.4rem" }} />
          กำลังโหลดข้อมูล...
        </p>
      ) : null}

      {dashboard ? (
        <>
          <p className="muted">
            ผู้ใช้: <strong>{dashboard.user.name}</strong> ({dashboard.user.email})
          </p>

          <div className="grid-3 section-space">
            <article className="card">
              <h3>เป้าหมายต่อวัน</h3>
              <p>{targetCalories ? `${targetCalories.toLocaleString()} kcal` : "ยังไม่ตั้งค่า"}</p>
            </article>
            <article className="card">
              <h3>บริโภคแล้ว</h3>
              <p>{consumedCalories.toLocaleString()} kcal</p>
            </article>
            <article className="card">
              <h3>คงเหลือ</h3>
              <p>{remainingCalories.toLocaleString()} kcal</p>
            </article>
          </div>

          <article className="card section-space">
            <h3>ความคืบหน้าแคลอรี่วันนี้</h3>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min(progressPercent, 100)}%` }} />
            </div>
            <p>
              {consumedCalories.toLocaleString()} / {targetCalories.toLocaleString()} kcal ({progressPercent}%)
            </p>
            {progressPercent > 100 ? (
              <p className="muted" style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
                ⚠️ เกินเป้าหมาย {(progressPercent - 100).toFixed(0)}%
              </p>
            ) : (
              <p className="muted" style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
                ✓ เหลือ {remainingCalories.toLocaleString()} kcal วันนี้
              </p>
            )}
          </article>

          <section className="section-space">
            <h2 className="section-title">บันทึกอาหารรายวัน</h2>

            <form className="form-panel" onSubmit={handleAddLog}>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="date">วันที่</label>
                  <input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="mealType">มื้ออาหาร</label>
                  <select
                    id="mealType"
                    value={mealType}
                    onChange={(event) =>
                      setMealType(event.target.value as "breakfast" | "lunch" | "dinner" | "snack")
                    }
                  >
                    <option value="breakfast">มื้อเช้า</option>
                    <option value="lunch">มื้อกลางวัน</option>
                    <option value="dinner">มื้อเย็น</option>
                    <option value="snack">มื้อว่าง</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="foodQuery">ค้นหาอาหาร</label>
                  <input
                    id="foodQuery"
                    value={foodQuery}
                    onChange={(event) => setFoodQuery(event.target.value)}
                    placeholder="เช่น ข้าวกล้อง, ปลา, โยเกิร์ต"
                  />
                </div>

                <div className="field">
                  <label htmlFor="servingMultiplier">จำนวนหน่วยบริโภค</label>
                  <input
                    id="servingMultiplier"
                    type="number"
                    min={0.25}
                    max={4}
                    step={0.25}
                    value={servingMultiplier}
                    onChange={(event) => setServingMultiplier(event.target.value)}
                  />
                </div>
              </div>

              <div className="inline-actions section-space">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleSearchFoods}
                  disabled={!foodQuery.trim() || foodSearching}
                >
                  {foodSearching
                    ? "กำลังค้นหา..."
                    : foodOptions.length > 0
                      ? "ค้นหาใหม่"
                      : "ค้นหาเมนู"}
                </button>
                {foodOptions.length > 0 && (
                  <span className="badge good">พบ {foodOptions.length} รายการ</span>
                )}
              </div>

              {foodOptions.length > 0 ? (
                <div className="field section-space">
                  <label htmlFor="foodId">เลือกเมนูที่ต้องการบันทึก</label>
                  <select id="foodId" value={foodId} onChange={(event) => setFoodId(event.target.value)}>
                    {foodOptions.map((food) => (
                      <option key={food.id} value={food.id}>
                        {food.nameThai} | {Math.round(food.calories)} kcal | คาร์บ {food.carbsG.toFixed(1)} g
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="inline-actions section-space">
                <button type="submit" className="btn btn-primary" disabled={logLoading}>
                  {logLoading ? "กำลังบันทึก..." : "บันทึกแคลอรี่"}
                </button>
              </div>
            </form>
          </section>

          <section className="section-space">
            <h2 className="section-title">รายการที่บันทึก ({dashboard.today.date})</h2>
            {dashboard.today.logs.length === 0 ? (
              <div className="empty-state">วันนี้ยังไม่มีรายการที่บันทึก</div>
            ) : (
              <div className="table-wrap">
                <table className="table-mobile-friendly">
                  <thead>
                    <tr>
                      <th>มื้อ</th>
                      <th>เมนู</th>
                      <th>ปริมาณ</th>
                      <th>แคลอรี่</th>
                      <th>คาร์บ</th>
                      <th>โปรตีน</th>
                      <th>ไขมัน</th>
                      <th>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.today.logs.map((log) => (
                      <tr key={log.id}>
                        <td data-label="มื้อ">{mealLabel[log.mealType] ?? log.mealType}</td>
                        <td data-label="เมนู">{log.foodName}</td>
                        <td data-label="ปริมาณ">{log.serving ?? "-"}</td>
                        <td data-label="แคลอรี่">{Math.round(log.calories)} kcal</td>
                        <td data-label="คาร์บ">{log.carbsG.toFixed(1)} g</td>
                        <td data-label="โปรตีน">{log.proteinG.toFixed(1)} g</td>
                        <td data-label="ไขมัน">{log.fatG.toFixed(1)} g</td>
                        <td data-label="จัดการ">
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => void handleDeleteLog(log.id)}
                          >
                            ลบ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}

      {message ? (
        <p className={`status ${message.type === "error" ? "error" : "success"}`}>
          {message.text}
        </p>
      ) : null}
    </section>
  );
}
