import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server"; // 修正
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  // reqは不要
  try {
    const supabase = createClient(); // 修正
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
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
