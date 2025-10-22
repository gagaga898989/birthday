// src/app/api/admin/gift-selections/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// GET: ギフト選択一覧を取得 (管理者用)
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

  // --- 管理者権限チェック (必須！) ---
  try {
    const adminUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isAdmin: true },
    });

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch (adminCheckError) {
    console.error("Admin check failed:", adminCheckError);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
  // --- 管理者権限チェックここまで ---

  try {
    // GiftSelectionテーブルから全件取得し、関連するUserとGiftの情報も取得
    const selections = await prisma.giftSelection.findMany({
      include: {
        user: {
          // ユーザー情報（emailなど）を取得
          select: {
            email: true,
          },
        },
        gift: {
          // ギフト情報（名前など）を取得
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc", // 新しい選択を上に表示
      },
    });

    return NextResponse.json(selections);
  } catch (error) {
    console.error("Failed to fetch gift selections:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    // await prisma.$disconnect(); // 必要に応じて
  }
}

// DELETE: ギフト選択を解除 (管理者用)
export async function DELETE(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // 認証チェック
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- 管理者権限チェック (必須！) ---
  try {
    const adminUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isAdmin: true },
    });

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch (adminCheckError) {
    console.error("Admin check failed:", adminCheckError);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
  // --- 管理者権限チェックここまで ---

  try {
    // リクエストボディから削除対象のIDを取得
    const { id: selectionId } = await req.json();

    if (!selectionId) {
      return NextResponse.json(
        { error: "Selection ID is required" },
        { status: 400 }
      );
    }

    // GiftSelection レコードを削除
    await prisma.giftSelection.delete({
      where: { id: selectionId },
    });

    // 成功レスポンス (No Content)
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete gift selection:", error);
    // 削除対象が見つからなかった場合のエラーハンドリング
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Record to delete does not exist." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    // await prisma.$disconnect(); // 必要に応じて
  }
}
