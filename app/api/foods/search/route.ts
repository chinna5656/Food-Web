import { NextRequest, NextResponse } from "next/server";

import { searchFoods } from "@/lib/backend/foods.service";
import { respondWithError } from "@/lib/backend/response";

export async function GET(request: NextRequest) {
  try {
    const result = await searchFoods(request.nextUrl.searchParams);
    return NextResponse.json(result);
  } catch (error) {
    return respondWithError(error, "ไม่สามารถค้นหาอาหารได้", "foods search error");
  }
}
