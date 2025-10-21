import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ギフト一覧取得 (GET)
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

  // 管理者チェック (本番では必須)
  // const userData = await prisma.user.findUnique({ where: { id: user.id } });
  // if (!userData?.isAdmin) {
  //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // }

  try {
    const gifts = await prisma.gift.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });
    return NextResponse.json(gifts);
  } catch (error) {
    console.error("Failed to fetch gifts:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// ギフト作成 (POST) - 必要に応じて追加
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // 管理者チェック (本番では必須)

  try {
    const { name, description, imageUrl } = await req.json();
    if (!name || !description) {
      return NextResponse.json(
        { error: "Name and description are required" },
        { status: 400 }
      );
    }
    const newGift = await prisma.gift.create({
      data: { name, description, imageUrl },
    });
    return NextResponse.json(newGift, { status: 201 });
  } catch (error) {
    console.error("Failed to create gift:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
