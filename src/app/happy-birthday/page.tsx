// src/app/happy-birthday/page.tsx
"use client"; // useRouter を使う場合は必要

import React, { useEffect } from "react"; // useEffect をインポート
import { useRouter } from "next/navigation"; // useRouter をインポート
import Link from "next/link"; // Link をインポート
import styles from "./page.module.css"; // CSSモジュールをインポート

export default function HappyBirthdayPage() {
  const router = useRouter(); // useRouter を初期化

  // 一定時間後にギフトページへ自動遷移するロジック (任意)
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/gift");
    }, 8000); // 少し長めに設定 (8秒)

    // コンポーネントがアンマウントされる際にタイマーをクリア
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className={styles.container}>
      <main className={styles.mainContent}>
        <div className={styles.card}>
          <div className={styles.icon}>🎂</div>
          <h1 className={styles.title}>お誕生日おめでとうございます！</h1>
          <p className={styles.message}>
            あなたにとって、
            <br />
            幸せと喜びに満ちた
            <br />
            素晴らしい一年になりますように。
          </p>

          {/* --- ギフトページへのボタン (ここから追加) --- */}
          <div className={styles.buttonContainer}>
            <Link href="/gift" className={styles.giftButton}>
              特別なギフトを見る 🎁
            </Link>
          </div>
          {/* --- ギフトページへのボタン (ここまで追加) --- */}
        </div>
      </main>
    </div>
  );
}
