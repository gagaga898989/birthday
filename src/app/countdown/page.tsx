"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const CountdownPage: React.FC = () => {
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [daysUntilBirthday, setDaysUntilBirthday] = useState<number | null>(
    null
  );
  const router = useRouter();

  useEffect(() => {
    const fetchBirthday = async () => {
      try {
        const response = await fetch("/api/user/birthday");
        if (!response.ok) {
          throw new Error("Failed to fetch birthday");
        }
        const data = await response.json();
        if (data.birthday) {
          setBirthday(new Date(data.birthday));
        } else {
          //誕生日が設定されていない場合
          router.push("/login");
        }
      } catch (error) {
        console.error(error);
        // エラーハンドリング（例：ログインページにリダイレクト）
        router.push("/login");
      }
    };

    fetchBirthday();
  }, [router]);

  useEffect(() => {
    if (birthday) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // 時刻をリセット
      const nextBirthday = new Date(
        today.getFullYear(),
        birthday.getMonth(),
        birthday.getDate()
      );
      nextBirthday.setHours(0, 0, 0, 0);

      if (today.getTime() > nextBirthday.getTime()) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
      }

      if (
        today.getMonth() === birthday.getMonth() &&
        today.getDate() === birthday.getDate()
      ) {
        // 誕生日当日の処理
        router.push("/happy-birthday"); // ギフトページへリダイレクト
        return;
      }

      const diffInTime = nextBirthday.getTime() - today.getTime();
      const diffInDays = Math.ceil(diffInTime / (1000 * 3600 * 24));
      setDaysUntilBirthday(diffInDays);
    }
  }, [birthday, router]);

  return (
    <main>
      <div className="text-center">
        <h1 className="text-4xl font-bold">
          {daysUntilBirthday !== null
            ? `誕生日まであと ${daysUntilBirthday} 日`
            : "誕生日情報を取得中..."}
        </h1>
      </div>
    </main>
  );
};

export default CountdownPage;
