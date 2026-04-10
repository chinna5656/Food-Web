import { NextRequest, NextResponse } from "next/server";

import {
  deleteChatMessages,
  getChatSession,
  sendChatMessage,
} from "@/lib/backend/chat.service";
import { respondWithError } from "@/lib/backend/response";
import { getUserFromRequest } from "@/lib/current-user";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const session = await getChatSession({
      id: user.id,
      name: user.name,
      diabetesType: user.diabetesType,
    });

    return NextResponse.json(session);
  } catch (error) {
    return respondWithError(error, "ไม่สามารถโหลดประวัติแชทได้", "chat get error");
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();

    const result = await sendChatMessage(
      {
        id: user.id,
        name: user.name,
        diabetesType: user.diabetesType,
      },
      payload
    );

    return NextResponse.json(result);
  } catch (error) {
    return respondWithError(error, "ไม่สามารถส่งข้อความได้", "chat post error");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const result = await deleteChatMessages(user.id, request.nextUrl.searchParams);
    return NextResponse.json(result);
  } catch (error) {
    return respondWithError(error, "ไม่สามารถลบข้อความได้", "chat delete error");
  }
}
