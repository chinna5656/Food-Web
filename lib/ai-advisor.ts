import type { AdvisorContext, AdvisorHistoryMessage } from "@/lib/chat-advisor";

interface OpenAiChatChoice {
  message?: {
    content?: string | Array<{ type?: string; text?: string }>;
  };
}

interface OpenAiChatResponse {
  choices?: OpenAiChatChoice[];
}

const DEFAULT_MODEL = "gpt-4.1-mini";
const DEFAULT_API_BASE_URL = "https://api.openai.com/v1";

function getApiKey() {
  return process.env.OPENAI_API_KEY?.trim() ?? "";
}

export function isAiAdvisorEnabled() {
  return Boolean(getApiKey());
}

function formatSystemPrompt(context: AdvisorContext) {
  const targetText = context.dailyCaloriesTarget
    ? `${context.dailyCaloriesTarget.toLocaleString()} kcal`
    : "ไม่มีข้อมูล";

  return [
    "คุณคือผู้ช่วยโภชนาการสำหรับผู้ป่วยเบาหวานของแอป GlucoPlate",
    "ตอบเป็นภาษาไทย ชัดเจน กระชับ และลงมือทำได้จริง",
    "ห้ามอ้างว่าเป็นแพทย์ และต้องระบุว่าเป็นคำแนะนำทั่วไปเมื่อมีความเสี่ยงทางการแพทย์",
    "ใช้ข้อมูลบริบทผู้ใช้ด้านล่างในการแนะนำให้เฉพาะบุคคล",
    `ชื่อผู้ใช้: ${context.userName}`,
    `ประเภทเบาหวาน: ${context.diabetesType ?? "ไม่ระบุ"}`,
    `แคลอรี่ที่กินวันนี้: ${Math.round(context.consumedCaloriesToday).toLocaleString()} kcal`,
    `คาร์บที่กินวันนี้: ${context.carbsToday.toFixed(1)} g`,
    `เป้าหมายแคลอรี่ต่อวัน: ${targetText}`,
    `จำนวนมื้อที่บันทึกแล้ว: ${context.mealsLoggedToday} มื้อ`,
    "ถ้าคำถามเกี่ยวกับอาการอันตราย ให้แนะนำพบแพทย์หรือฉุกเฉินทันที",
  ].join("\n");
}

function toOpenAiMessages(
  userMessage: string,
  context: AdvisorContext,
  history: AdvisorHistoryMessage[]
) {
  const recentHistory = history.slice(-12);

  return [
    {
      role: "system",
      content: formatSystemPrompt(context),
    },
    ...recentHistory.map((item) => ({
      role: item.role,
      content: item.content,
    })),
    {
      role: "user",
      content: userMessage,
    },
  ];
}

function readAssistantText(data: OpenAiChatResponse) {
  const firstChoice = data.choices?.[0];
  const content = firstChoice?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((piece) => piece.text ?? "")
      .join("\n")
      .trim();
  }

  return "";
}

export async function requestAiAdvisorReply(
  userMessage: string,
  context: AdvisorContext,
  history: AdvisorHistoryMessage[]
) {
  const apiKey = getApiKey();

  if (!apiKey) {
    return null;
  }

  const apiBaseUrl = process.env.OPENAI_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;
  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);

  try {
    const response = await fetch(`${apiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        max_tokens: 700,
        messages: toOpenAiMessages(userMessage, context, history),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ai advisor api error", response.status, errorText);
      return null;
    }

    const data = (await response.json()) as OpenAiChatResponse;
    const text = readAssistantText(data);

    return text || null;
  } catch (error) {
    console.error("ai advisor request failed", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
