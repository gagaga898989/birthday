// 設置場所: src/app/happy-birthday/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const HappyBirthdayPage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // 3秒後にギフトページへリダイレクト
    const timer = setTimeout(() => {
      router.push("/gift");
    }, 3000);

    // コンポーネントがアンマウントされる際にタイマーをクリアします
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main>
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-bold">お誕生日おめでとうございます！🎉</h1>
        <p className="mt-4 text-xl">特別なギフトページへご案内します...</p>
      </div>
    </main>
  );
};

export default HappyBirthdayPage;
