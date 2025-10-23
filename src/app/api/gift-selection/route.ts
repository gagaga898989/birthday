// src/app/api/gift-selection/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export const revalidate = 0;

// POST: ユーザーがギフトを選択したときに呼び出される
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // 認証チェック
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { giftId } = await req.json();

    if (!giftId) {
      return NextResponse.json(
        { error: "Gift ID is required" },
        { status: 400 }
      );
    }

    // ユーザーが既にギフトを選択済みかチェック (ユニーク制約がある場合)
    const existingSelection = await prisma.giftSelection.findUnique({
      where: { userId: user.id },
    });

    if (existingSelection) {
      // すでに選択済みの場合のエラーハンドリング
      return NextResponse.json(
        { error: "Gift already selected" },
        { status: 409 }
      ); // 409 Conflict
    }

    // GiftSelection レコードを作成
    const newSelection = await prisma.giftSelection.create({
      data: {
        userId: user.id,
        giftId: giftId,
      },
    });

    return NextResponse.json(newSelection, { status: 201 });
  } catch (error) {
    console.error("Failed to save gift selection:", error);
    // Prismaのユニーク制約違反の場合のエラーハンドリングを追加することも可能
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // P2002はユニーク制約違反。ここでは findUnique でチェックしているので通常は通らないはずだが念のため
      return NextResponse.json(
        { error: "Gift already selected (Constraint Violation)" },
        { status: 409 }
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

// GET: ユーザーがギフトを選択済みか確認するために呼び出される
export async function GET(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // 認証チェック
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const selection = await prisma.giftSelection.findUnique({
      where: { userId: user.id },
      select: {
        giftId: true, // 選択したギフトIDだけ返す (必要に応じて変更)
        // createdAt: true // 選択日時も返す場合
      },
    });

    if (!selection) {
      // まだ選択していない場合は 404 Not Found を返す
      return NextResponse.json({ error: "Not selected yet" }, { status: 404 });
    }

    return NextResponse.json(selection); // 選択済みの場合は giftId を返す
  } catch (error) {
    console.error("Failed to fetch gift selection:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    // await prisma.$disconnect(); // 必要に応じて
  }
}
