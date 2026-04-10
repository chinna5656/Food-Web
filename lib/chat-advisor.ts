export interface AdvisorContext {
  userName: string;
  diabetesType: string | null;
  dailyCaloriesTarget: number | null;
  consumedCaloriesToday: number;
  carbsToday: number;
  mealsLoggedToday: number;
}

export interface AdvisorHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

function getRemainingCalories(context: AdvisorContext) {
  if (!context.dailyCaloriesTarget) {
    return null;
  }

  return context.dailyCaloriesTarget - context.consumedCaloriesToday;
}

function summarizeContext(context: AdvisorContext) {
  const remain = getRemainingCalories(context);

  const lines = [
    `สถานะวันนี้ของคุณ ${context.userName}`,
    `- บริโภคแล้ว: ${Math.round(context.consumedCaloriesToday).toLocaleString()} kcal`,
    `- คาร์บรวม: ${context.carbsToday.toFixed(1)} g`,
    `- จำนวนมื้อที่บันทึก: ${context.mealsLoggedToday} มื้อ`,
  ];

  if (context.dailyCaloriesTarget) {
    lines.push(
      `- เป้าหมายรายวัน: ${context.dailyCaloriesTarget.toLocaleString()} kcal (${remain !== null ? `${remain > 0 ? "เหลือ" : "เกิน"} ${Math.abs(remain).toLocaleString()} kcal` : "ไม่มีข้อมูล"})`
    );
  }

  if (context.diabetesType) {
    lines.push(`- ประเภทเบาหวานที่ระบุ: ${context.diabetesType}`);
  }

  return lines.join("\n");
}

function containsAny(message: string, keywords: string[]) {
  return keywords.some((keyword) => message.includes(keyword));
}

const TOPIC_MAP: Array<{ topic: string; keywords: string[] }> = [
  { topic: "แคลอรี่", keywords: ["แคล", "calorie", "พลังงาน", "เกิน", "เหลือ"] },
  { topic: "คาร์บ", keywords: ["คาร์บ", "carb", "แป้ง", "ข้าว"] },
  { topic: "ของหวาน", keywords: ["หวาน", "น้ำตาล", "ของหวาน", "ขนม", "ชาไข่มุก"] },
  { topic: "แผนมื้ออาหาร", keywords: ["กินอะไร", "มื้อ", "เมนู", "meal", "dinner", "lunch"] },
  { topic: "ออกกำลังกาย", keywords: ["ออกกำลัง", "exercise", "เดิน", "วิ่ง", "ฟิตเนส"] },
];

function extractTopics(text: string) {
  const normalized = text.toLowerCase();
  return TOPIC_MAP.filter((item) => containsAny(normalized, item.keywords)).map((item) => item.topic);
}

function summarizeHistory(history: AdvisorHistoryMessage[]) {
  const recent = history.slice(-12);
  const userMessages = recent.filter((item) => item.role === "user");
  const assistantMessages = recent.filter((item) => item.role === "assistant");

  const topicCount = new Map<string, number>();
  for (const msg of userMessages) {
    for (const topic of extractTopics(msg.content)) {
      topicCount.set(topic, (topicCount.get(topic) ?? 0) + 1);
    }
  }

  const focusTopics = [...topicCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([topic]) => topic);

  return {
    hasHistory: userMessages.length > 0,
    userMessageCount: userMessages.length,
    focusTopics,
    latestUserMessage: userMessages.at(-1)?.content ?? null,
    latestAssistantMessage: assistantMessages.at(-1)?.content ?? null,
  };
}

export function generateAdvisorReply(
  rawMessage: string,
  context: AdvisorContext,
  history: AdvisorHistoryMessage[] = []
) {
  const message = rawMessage.toLowerCase();
  const remain = getRemainingCalories(context);
  const historyInfo = summarizeHistory(history);
  const isFollowUp =
    historyInfo.hasHistory &&
    containsAny(message, ["ต่อ", "เพิ่ม", "ละเอียด", "ขยาย", "อีกหน่อย", "ยังไงต่อ", "แล้วต่อ"]) &&
    rawMessage.trim().length <= 120;

  const historyLine =
    historyInfo.focusTopics.length > 0
      ? `บริบทก่อนหน้า: คุณคุยเรื่อง ${historyInfo.focusTopics.join(" และ ")}`
      : null;

  if (
    containsAny(message, [
      "หน้ามืด",
      "เวียนหัวมาก",
      "มือสั่น",
      "เหงื่อออกเยอะ",
      "หายใจไม่ออก",
      "หมดสติ",
      "น้ำตาลต่ำ",
      "น้ำตาลสูงมาก",
      "แน่นหน้าอก",
    ])
  ) {
    return [
      "อาการที่คุณเล่ามีความเสี่ยง ควรดูแลเร่งด่วน",
      "1. วัดน้ำตาลปลายนิ้วทันทีถ้าทำได้",
      "2. ถ้าน้ำตาลต่ำมากและรู้สึกแย่ ให้รับคาร์บดูดซึมเร็ว 15 กรัม แล้ววัดซ้ำใน 15 นาที",
      "3. หากมีอาการหนัก เช่น ซึมลง เจ็บหน้าอก หายใจลำบาก ให้โทร 1669 หรือไปโรงพยาบาลทันที",
      "หมายเหตุ: คำแนะนำนี้ไม่แทนการวินิจฉัยจากแพทย์",
    ].join("\n");
  }

  if (containsAny(message, ["สวัสดี", "hello", "hi", "เริ่ม", "ช่วยอะไรได้บ้าง"])) {
    const continuityHint =
      historyInfo.userMessageCount >= 2 && historyLine
        ? `${historyLine} และวันนี้เป็นการคุยต่อเนื่อง`
        : "";

    return [
      `สวัสดี ${context.userName} ผมเป็นผู้ช่วยโภชนาการของคุณ`,
      summarizeContext(context),
      continuityHint,
      "ผมช่วยได้เรื่อง: คำนวณแคลอรี่, จัดมื้ออาหาร, ลดคาร์บ, เลือกของว่าง, และการวางแผนอาหารเมื่ออยู่นอกบ้าน",
      "ลองถามต่อได้ เช่น 'วันนี้ควรกินอะไรเย็นนี้' หรือ 'คาร์บวันนี้เยอะไปไหม'",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if (isFollowUp && historyInfo.latestAssistantMessage) {
    return [
      "รับคำถามต่อเนื่องแล้ว ผมจะต่อจากคำแนะนำล่าสุดให้แม่นขึ้น",
      historyLine ?? "",
      summarizeContext(context),
      remain === null
        ? "เพื่อคำแนะนำที่แม่นยำขึ้น แนะนำตั้งค่าเป้าหมายแคลอรี่ในหน้าคำนวณก่อน"
        : remain >= 0
          ? `ตอนนี้ยังเหลือ ${remain.toLocaleString()} kcal ให้จัดมื้อถัดไปเป็นโปรตีน + ผัก + คาร์บเชิงซ้อนสัดส่วนเล็ก`
          : `ตอนนี้เกิน ${Math.abs(remain).toLocaleString()} kcal ควรลดคาร์บมื้อถัดไปและเน้นอาหารไฟเบอร์สูงแทน`,
      "ถ้าต้องการ ผมสามารถแตกเป็นแผน 1 วัน (เช้า-กลางวัน-เย็น-ว่าง) ให้ต่อได้เลย",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if (containsAny(message, ["แคล", "calorie", "พลังงาน", "เกิน", "เหลือ"])) {
    return [
      historyLine ?? "",
      summarizeContext(context),
      remain === null
        ? "ยังไม่มีเป้าหมายแคลอรี่ล่าสุด แนะนำไปที่หน้าคำนวณแคลอรี่ก่อน เพื่อให้แนะนำได้แม่นยำขึ้น"
        : remain >= 0
          ? `วันนี้คุณยังเหลือประมาณ ${remain.toLocaleString()} kcal แนะนำเน้นโปรตีนไม่ติดมัน + ผักไฟเบอร์สูง และคาร์บเชิงซ้อนปริมาณพอดี`
          : `วันนี้เกินเป้าหมายประมาณ ${Math.abs(remain).toLocaleString()} kcal มื้อต่อไปควรลดคาร์บ/ของหวาน และเพิ่มการขยับร่างกายเบาๆ 20-30 นาที`,
      "ตัวอย่างมื้อที่สมดุล: ข้าวกล้อง 1 ทัพพี + อกไก่/ปลา + ผัก 2 ส่วน",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if (containsAny(message, ["กินอะไร", "เมนู", "อาหาร", "มื้อ", "meal", "dinner", "lunch", "breakfast"])) {
    const suggestions = [
      "- มื้อเช้า: ข้าวโอ๊ตไม่หวาน + ไข่ต้ม + ฝรั่งครึ่งผล",
      "- มื้อกลางวัน: ข้าวกล้อง + อกไก่ย่าง + ผักลวก",
      "- มื้อเย็น: ปลานึ่งมะนาว + ต้มจืดผักรวม + ข้าวปริมาณพอเหมาะ",
      "- ของว่าง: กรีกโยเกิร์ตไม่หวาน หรือถั่วไม่เค็ม 1 กำมือเล็ก",
    ];

    return [
      historyLine ?? "",
      "แนะนำเมนูที่เหมาะกับผู้ป่วยเบาหวาน (คุมคาร์บและน้ำตาล)",
      suggestions.join("\n"),
      "หลักคิด: เลือกคาร์บเชิงซ้อน + โปรตีน + ผักไฟเบอร์สูง และหลีกเลี่ยงเครื่องดื่มหวาน",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if (containsAny(message, ["หวาน", "น้ำตาล", "ของหวาน", "ชาไข่มุก", "dessert", "cake", "ขนม"])) {
    return [
      "ถ้าอยากกินของหวาน ให้ใช้หลัก 3 ข้อนี้",
      "1. ลดปริมาณลงครึ่งหนึ่งก่อน และกินหลังอาหารหลัก",
      "2. หลีกเลี่ยงเครื่องดื่มหวาน ให้เลือกหวาน 0% หรือไม่หวาน",
      "3. วันที่กินหวาน ควรลดคาร์บมื้ออื่นลงและเฝ้าดูน้ำตาลมากขึ้น",
      "หากต้องการ ผมช่วยคำนวณ 'ทดแทนคาร์บ' ให้ตามเมนูที่จะกินได้",
    ].join("\n");
  }

  if (containsAny(message, ["ออกกำลัง", "exercise", "เดิน", "วิ่ง", "ฟิตเนส"])) {
    return [
      "แผนออกกำลังกายเริ่มต้น (ปลอดภัยและทำได้จริง)",
      "- เดินเร็ว 20-30 นาที/วัน อย่างน้อย 5 วันต่อสัปดาห์",
      "- เวทเบา 2-3 วัน/สัปดาห์",
      "- ก่อนและหลังออกกำลังกาย ควรสังเกตอาการน้ำตาลต่ำ",
      "ถ้ามีโรคร่วม/ยาที่ใช้อยู่ แนะนำปรึกษาแพทย์ก่อนปรับความหนัก",
    ].join("\n");
  }

  return [
    `รับทราบครับ ${context.userName}`,
    historyLine ?? "",
    summarizeContext(context),
    "ผมแนะนำให้ตั้งคำถามเฉพาะเรื่องเพื่อได้คำตอบแม่นยำขึ้น เช่น",
    "- วันนี้เย็นควรกินอะไรไม่ให้เกินแคลอรี่",
    "- ถ้าจะกินของหวานควรปรับมื้ออื่นยังไง",
    "- ช่วยวางแผนมื้อพรุ่งนี้แบบคุมคาร์บให้หน่อย",
    "หมายเหตุ: คำตอบนี้เป็นคำแนะนำทั่วไป ไม่แทนการรักษาทางการแพทย์",
  ]
    .filter(Boolean)
    .join("\n\n");
}
