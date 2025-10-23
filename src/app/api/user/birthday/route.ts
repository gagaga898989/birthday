import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server"; // これはそのまま
import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient(); // <- このグローバルインスタンスを削除

export async function GET() {
  const prisma = new PrismaClient(); // <- 関数内で PrismaClient を初期化
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { email: user.email! },
      select: {
        birthday: true,
      },
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const birthday = userData.birthday;

    return NextResponse.json({ birthday });
  } catch (error) {
    console.error("誕生日情報の取得中にエラー発生:", error); // 具体的なエラーをログに出力
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    // サーバーレス環境では、リクエストごとに接続を切断するのが安全
    await prisma.$disconnect();
  }
}
