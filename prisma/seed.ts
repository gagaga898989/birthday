import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

// Prismaクライアントを初期化
const prisma = new PrismaClient();

// Supabase Adminクライアントを初期化
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("Seeding started...");

  // --- テストユーザーデータ ---
  // パスワードは全て 'password' です
  const users = [
    {
      email: "user1@example.com",
      password: "password",
      birthday: new Date("2025-10-20T00:00:00.000Z"), // もうすぐ誕生日
    },
    {
      email: "user2@example.com",
      password: "password",
      birthday: new Date(), // 今日が誕生日
    },
    {
      email: "user3@example.com",
      password: "password",
      birthday: new Date("2025-12-31T00:00:00.000Z"), // まだ先
    },
    {
      email: "user5@example.com",
      password: "password",
      birthday: new Date("2025-10-25T00:00:00.000Z"), // まだ先
    },
  ];

  for (const userData of users) {
    // 1. Supabase Authにユーザーを作成
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // メール認証をスキップして有効化
      });

    if (authError) {
      console.error(
        `Error creating Supabase user ${userData.email}:`,
        authError.message
      );
      continue; // エラーが発生した場合はスキップ
    }

    if (authData.user) {
      // 2. PostgreSQLのUserテーブルにユーザーを作成
      const user = await prisma.user.create({
        data: {
          id: authData.user.id, // SupabaseのIDをPrismaのIDとして使用
          email: userData.email,
          birthday: userData.birthday,
        },
      });
      console.log(
        `Created user: ${user.email} (Birthday: ${user.birthday?.toLocaleDateString()})`
      );
    }
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
