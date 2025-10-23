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
      console.log("🎯 fetchBirthday() called");

      try {
        console.log("📡 Fetching from /api/user/birthday ...");
        const response = await fetch("/api/user/birthday", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("📨 Response status:", response.status);

        // ステータス確認
        if (!response.ok) {
          console.warn("⚠️ Response not OK:", response.statusText);
          const errorText = await response.text();
          console.warn("⚠️ Response text:", errorText);
          throw new Error("Failed to fetch birthday");
        }

        const data = await response.json();
        console.log("📦 Response JSON:", data);

        if (data.birthday) {
          console.log("🎉 Birthday found:", data.birthday);
          setBirthday(new Date(data.birthday));
        } else {
          console.warn(
            "🚫 No birthday found in response. Redirecting to /login..."
          );
          router.push("/login");
        }
      } catch (error) {
        console.error("💥 Error occurred while fetching birthday:", error);
        // API が落ちた or Unauthorized などのとき
        router.push("/login");
      }
    };

    fetchBirthday();
  }, [router]);

  useEffect(() => {
    console.log(
      "🧮 useEffect[birthday] triggered. Current birthday:",
      birthday
    );

    if (birthday) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // 時刻リセット
      console.log("📅 Today:", today.toISOString());

      const nextBirthday = new Date(
        today.getFullYear(),
        birthday.getMonth(),
        birthday.getDate()
      );
      nextBirthday.setHours(0, 0, 0, 0);
      console.log("🎂 Next birthday this year:", nextBirthday.toISOString());

      // 今年の誕生日が過ぎていたら翌年に設定
      if (today.getTime() > nextBirthday.getTime()) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
        console.log(
          "➡️ Birthday already passed. Updated to next year:",
          nextBirthday.toISOString()
        );
      }

      // 今日が誕生日か？
      if (
        today.getMonth() === birthday.getMonth() &&
        today.getDate() === birthday.getDate()
      ) {
        console.log("🎉 It's the user's birthday today! Redirecting...");
        router.push("/happy-birthday");
        return;
      }

      const diffInTime = nextBirthday.getTime() - today.getTime();
      const diffInDays = Math.ceil(diffInTime / (1000 * 3600 * 24));
      console.log(`📆 Days until birthday: ${diffInDays}`);

      setDaysUntilBirthday(diffInDays);
    } else {
      console.log("ℹ️ No birthday set yet — waiting for fetch...");
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
