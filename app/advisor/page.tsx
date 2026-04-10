"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type AdvisorContext = {
  userName: string;
  diabetesType: string | null;
  dailyCaloriesTarget: number | null;
  consumedCaloriesToday: number;
  carbsToday: number;
  mealsLoggedToday: number;
};

const quickPrompts = [
  "วันนี้ควรกินอะไรดีให้ไม่เกินแคลอรี่",
  "คาร์บวันนี้เยอะไปไหม",
  "ถ้าหิวของหวานควรเลือกอะไร",
  "ช่วยวางแผนมื้อเย็นให้หน่อย",
  "ควรออกกำลังกายแบบไหนสำหรับมือใหม่",
];

export default function AdvisorPage() {
  const router = useRouter();
  const listRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [context, setContext] = useState<AdvisorContext | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const remainingCalories = useMemo(() => {
    if (!context?.dailyCaloriesTarget) {
      return null;
    }

    return context.dailyCaloriesTarget - context.consumedCaloriesToday;
  }, [context]);

  async function loadChat() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat/advisor");
      const data = await response.json();

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message ?? "ไม่สามารถโหลดแชทได้");
      }

      setMessages(data.messages as ChatMessage[]);
      setContext(data.context as AdvisorContext);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(messageText?: string) {
    const payloadText = (messageText ?? text).trim();

    if (!payloadText || sending) {
      return;
    }

    setSending(true);
    setError(null);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/chat/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: payloadText }),
      });

      const data = await response.json();

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message ?? "ส่งข้อความไม่สำเร็จ");
      }

      setContext(data.context as AdvisorContext);
      setMessages((previous) => [
        ...previous,
        data.userMessage as ChatMessage,
        data.assistantMessage as ChatMessage,
      ]);
      setText("");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "เกิดข้อผิดพลาด");
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage();
  }

  async function handleDeleteMessage(messageId: string) {
    if (!messageId || deletingMessageId || clearingHistory) {
      return;
    }

    if (messageId === "welcome") {
      setMessages((previous) => previous.filter((item) => item.id !== "welcome"));
      return;
    }

    setDeletingMessageId(messageId);
    setError(null);
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/chat/advisor?id=${messageId}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "ลบข้อความไม่สำเร็จ");
      }

      setMessages((previous) => previous.filter((item) => item.id !== messageId));
      setStatusMessage("ลบข้อความเรียบร้อย");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "เกิดข้อผิดพลาด");
    } finally {
      setDeletingMessageId(null);
    }
  }

  async function handleClearHistory() {
    if (clearingHistory || sending) {
      return;
    }

    const confirmed = window.confirm("ยืนยันล้างประวัติแชททั้งหมด?");

    if (!confirmed) {
      return;
    }

    setClearingHistory(true);
    setError(null);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/chat/advisor?all=true", {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "ล้างประวัติไม่สำเร็จ");
      }

      setStatusMessage("ล้างประวัติแชททั้งหมดแล้ว");
      await loadChat();
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : "เกิดข้อผิดพลาด");
    } finally {
      setClearingHistory(false);
    }
  }

  useEffect(() => {
    void loadChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!listRef.current) {
      return;
    }

    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, sending]);

  return (
    <section className="section-space">
      <h1 className="section-title">แชทบอทคำแนะนำโภชนาการ</h1>
      <p className="muted">
        ผู้ช่วยนี้ใช้ข้อมูลแคลอรี่และพฤติกรรมการกินของคุณเพื่อให้คำแนะนำแบบเฉพาะบุคคล
      </p>

      <div className="inline-actions section-space">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => router.push("/dashboard")}
          disabled={sending || loading}
        >
          กลับหน้าแดชบอร์ด
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => void handleClearHistory()}
          disabled={sending || loading || clearingHistory || messages.length === 0}
        >
          {clearingHistory ? "กำลังล้าง..." : "ล้างประวัติแชท"}
        </button>
      </div>

      {context ? (
        <div className="grid-3 section-space">
          <article className="card">
            <h3>ผู้ใช้</h3>
            <p>{context.userName}</p>
            <p className="muted">เบาหวาน: {context.diabetesType ?? "ไม่ระบุ"}</p>
          </article>
          <article className="card">
            <h3>วันนี้</h3>
            <p>{Math.round(context.consumedCaloriesToday).toLocaleString()} kcal</p>
            <p className="muted">คาร์บ {context.carbsToday.toFixed(1)} g</p>
          </article>
          <article className="card">
            <h3>เป้าหมาย</h3>
            <p>
              {context.dailyCaloriesTarget
                ? `${context.dailyCaloriesTarget.toLocaleString()} kcal`
                : "ยังไม่ตั้งเป้าหมาย"}
            </p>
            <p className="muted">
              {remainingCalories === null
                ? "ไปหน้าคำนวณเพื่อบันทึกเป้าหมาย"
                : `${remainingCalories >= 0 ? "เหลือ" : "เกิน"} ${Math.abs(remainingCalories).toLocaleString()} kcal`}
            </p>
          </article>
        </div>
      ) : null}

      <div className="chat-shell section-space">
        <div className="chat-panel">
          <div className="chat-prompts" aria-label="คำถามแนะนำ">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="chip"
                onClick={() => void sendMessage(prompt)}
                disabled={sending}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="chat-feed" ref={listRef} aria-live="polite">
            {loading ? (
              <div className="empty-state">
                <span className="loading-spinner" style={{ marginRight: "0.45rem" }} />
                กำลังโหลดข้อความ...
              </div>
            ) : messages.length === 0 ? (
              <div className="empty-state">ยังไม่มีบทสนทนา เริ่มพิมพ์คำถามได้เลย</div>
            ) : (
              messages.map((message) => (
                <article
                  key={message.id}
                  className={`chat-row ${message.role === "user" ? "user" : "assistant"}`}
                >
                  <div className={`chat-bubble ${message.role === "user" ? "user" : "assistant"}`}>
                    <div className="chat-bubble-head">
                      <span className={`badge ${message.role === "user" ? "warn" : "good"}`}>
                        {message.role === "user" ? "คุณ" : "ผู้ช่วย"}
                      </span>
                      <button
                        type="button"
                        className="chat-delete-btn"
                        onClick={() => void handleDeleteMessage(message.id)}
                        disabled={deletingMessageId === message.id || clearingHistory || sending}
                      >
                        {deletingMessageId === message.id ? "กำลังลบ..." : "ลบ"}
                      </button>
                    </div>
                    <p style={{ whiteSpace: "pre-line" }}>{message.content}</p>
                  </div>
                </article>
              ))
            )}
          </div>

          <form className="chat-input-wrap" onSubmit={handleSubmit}>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="พิมพ์คำถามของคุณ เช่น ควรจัดมื้อเย็นยังไงไม่ให้คาร์บสูง"
              maxLength={600}
              rows={3}
              disabled={sending}
            />
            <div className="inline-actions">
              <span className="muted">{text.length}/600</span>
              <button type="submit" className="btn btn-primary" disabled={sending || !text.trim()}>
                {sending ? "กำลังส่ง..." : "ส่งข้อความ"}
              </button>
            </div>
            {statusMessage ? <p className="status success">{statusMessage}</p> : null}
            {error ? <p className="status error">{error}</p> : null}
          </form>
        </div>
      </div>

      <p className="muted section-space" style={{ fontSize: "0.9rem" }}>
        หมายเหตุ: คำแนะนำจากแชทบอทเป็นข้อมูลทั่วไป ไม่ใช่การวินิจฉัยหรือคำสั่งรักษาทางการแพทย์
      </p>
    </section>
  );
}
