// 修正対象: src/app/countdown/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const CountdownPage: React.FC = () => {
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [daysUntilBirthday, setDaysUntilBirthday] = useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchBirthday = async () => {
      try {
        const response = await fetch("/api/user/birthday");
        if (!response.ok) {
          // 401 Unauthorizedの場合はログインページにリダイレクト
          if (response.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch birthday");
        }
        const data = await response.json();
        if (data.birthday) {
          setBirthday(new Date(data.birthday));
        }
      } catch (error) {
        console.error(error);
        router.push("/login"); // その他のエラーでもログインページへ
      } finally {
        setIsLoading(false);
      }
    };

    fetchBirthday();
  }, [router]);

  useEffect(() => {
    if (birthday) {
      const today = new Date();
      // 時間をリセットして日付のみで比較
      today.setHours(0, 0, 0, 0);

      const nextBirthday = new Date(
        today.getFullYear(),
        birthday.getMonth(),
        birthday.getDate()
      );

      // 今年の誕生日が既に過ぎていたら来年の日付に設定
      if (today.getTime() > nextBirthday.getTime()) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
      }

      // 誕生日当日のチェック
      if (
        today.getMonth() === birthday.getMonth() &&
        today.getDate() === birthday.getDate()
      ) {
        // ★変更点: お祝いページへリダイレクト
        router.push("/happy-birthday");
        return;
      }

      // 誕生日までの日数を計算
      const diffInTime = nextBirthday.getTime() - today.getTime();
      const diffInDays = Math.ceil(diffInTime / (1000 * 3600 * 24));
      setDaysUntilBirthday(diffInDays);
    }
  }, [birthday, router]);

  const renderContent = () => {
    if (isLoading) {
      return "誕生日情報を取得中...";
    }
    if (daysUntilBirthday !== null) {
      return `誕生日まであと ${daysUntilBirthday} 日`;
    }
    // 誕生日当日でリダイレクト中の場合など
    return "リダイレクトしています...";
  };

  return (
    <main>
      <div className="text-center">
        <h1 className="text-4xl font-bold">{renderContent()}</h1>
      </div>
    </main>
  );
};

export default CountdownPage;
