import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      // "User" を "user" に修正
      where: { email: user.email! }, // emailがnullでないことを保証
      select: {
        birthday: true,
      },
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ダミーの誕生日データを返す（実際のデータがない場合）
    const birthday = userData.birthday || new Date("2025-12-24T00:00:00.000Z");

    return NextResponse.json({ birthday });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
