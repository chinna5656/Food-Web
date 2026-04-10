import { NextResponse } from "next/server";

import { BackendError } from "@/backend/errors";

export function respondWithError(error: unknown, fallbackMessage: string, logTag: string) {
  console.error(logTag, error);

  if (error instanceof BackendError) {
    return NextResponse.json(
      {
        message: error.message,
        ...(error.details !== undefined ? { errors: error.details } : {}),
      },
      { status: error.status }
    );
  }

  return NextResponse.json({ message: fallbackMessage }, { status: 500 });
}
