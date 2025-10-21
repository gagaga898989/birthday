import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // 認証チェック
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ここで管理者かどうかをチェックするロジックを追加します（本番環境では必須）
  // 例: const userData = await prisma.user.findUnique({ where: { id: user.id } });
  // if (!userData?.isAdmin) {
  //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        birthday: true,
        isAdmin: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
