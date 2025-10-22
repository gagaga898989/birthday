"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import styles from "./page.module.css"; // ★CSSモジュールをインポート

type Gift = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  createdAt: string;
};

const GiftPage: React.FC = () => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [alreadySelected, setAlreadySelected] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchGifts = async () => {
      setLoading(true);
      setError(null);
      setSubmitMessage(null);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setError("ギフト情報を表示するにはログインが必要です。");
        setLoading(false);
        // setTimeout(() => router.push('/login'), 2000);
        return;
      }

      try {
        const response = await fetch("/api/admin/gifts"); // ギフト一覧取得API

        if (!response.ok) {
          if (response.status === 401) {
            setError("ギフト情報を取得する権限がありません。");
          } else {
            throw new Error(`Failed to fetch gifts: ${response.statusText}`);
          }
          setGifts([]);
          return;
        }

        const data: Gift[] = await response.json();
        setGifts(data);

        // ユーザーが既に選択済みか確認
        try {
          // ★ GET /api/gift-selection を呼び出す
          const selectionRes = await fetch("/api/gift-selection", {
            headers: {
              Authorization: `Bearer ${session.access_token}`, // 認証ヘッダーを追加
            },
          });
          if (selectionRes.ok) {
            const selectionData = await selectionRes.json();
            if (selectionData && selectionData.giftId) {
              setAlreadySelected(true);
              setSubmitMessage("すでにギフトを選択済みです。");
            }
          } else if (selectionRes.status !== 404) {
            // 404 (未選択) 以外はエラー
            console.error(
              "Failed to check existing selection:",
              selectionRes.statusText
            );
            // 必要であればエラーメッセージを表示
            // setError("選択状況の確認に失敗しました。");
          }
        } catch (selectionError) {
          console.error("Error checking existing selection:", selectionError);
          // 必要であればエラーメッセージを表示
          // setError("選択状況の確認中にエラーが発生しました。");
        }
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "ギフト情報の取得中にエラーが発生しました。"
        );
        setGifts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGifts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 依存配列は空のまま

  // ギフト選択処理 (変更なし)
  const handleSelectGift = async (gift: Gift) => {
    if (submitting || alreadySelected) return;

    const confirmed = window.confirm(
      `「${gift.name}」を選びます。よろしいですか？\n（一度選ぶと変更できません）`
    );

    if (confirmed) {
      setSubmitting(true);
      setSubmitMessage(null);
      setError(null);

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session) {
          throw new Error("Not authenticated");
        }

        const response = await fetch("/api/gift-selection", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ giftId: gift.id }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 409) {
            setSubmitMessage("すでにギフトを選択済みです。");
            setAlreadySelected(true);
          } else {
            throw new Error(
              errorData.error ||
                `Failed to submit selection: ${response.statusText}`
            );
          }
        } else {
          router.push("/gift-selected"); // 完了ページへリダイレクト
        }
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "選択の送信中にエラーが発生しました。"
        );
        setSubmitting(false); // エラー時は送信中状態を解除
      }
    }
  };

  return (
    // ★ ルート要素に .container クラスを適用
    <main className={styles.container}>
      {/* ★ ヘッダー部分を div で囲みクラスを適用 */}
      <div className={styles.header}>
        <h1 className={styles.title}>お誕生日おめでとうございます！🎉</h1>
        <p className={styles.subtitle}>特別なギフトをご用意しました。</p>
      </div>

      {/* ローディング、エラー、送信メッセージ表示エリア */}
      {(loading || error || submitMessage) && (
        <div className={styles.messageArea}>
          {loading && (
            <p className={styles.loadingText}>ギフトを読み込んでいます...</p>
          )}
          {error && <p className={styles.errorText}>エラー: {error}</p>}
          {submitMessage && <p className={styles.infoText}>{submitMessage}</p>}
        </div>
      )}

      {/* ギフトリスト表示 */}
      {!loading && !error && (
        // ★ ギフトグリッドにクラスを適用
        <div className={styles.giftGrid}>
          {gifts.length === 0 && !alreadySelected ? ( // 選択済みでない場合のみ表示
            <p className={`${styles.messageArea} col-span-full`}>
              現在、利用可能なギフトはありません。
            </p>
          ) : (
            gifts.map((gift) => (
              // ★ ギフトカードにクラスを適用
              <div key={gift.id} className={styles.giftCard}>
                {/* 画像表示 */}
                {gift.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={gift.imageUrl}
                    alt={gift.name}
                    className={styles.giftImage} // ★ 画像クラス適用
                  />
                ) : (
                  // 画像がない場合のプレースホルダー
                  <div className={styles.giftImagePlaceholder}>
                    <span>No Image</span>
                  </div>
                )}
                {/* ★ カード内容コンテナにクラス適用 */}
                <div className={styles.cardContent}>
                  {/* ★ ギフト名クラス適用 */}
                  <h2 className={styles.giftName}>{gift.name}</h2>
                  {/* ★ 説明クラス適用 */}
                  <p className={styles.giftDescription}>{gift.description}</p>
                  {/* ★ ボタンラッパークラス適用 */}
                  <div className={styles.buttonWrapper}>
                    {/* ★ 選択ボタンクラス適用 */}
                    <button
                      onClick={() => handleSelectGift(gift)}
                      disabled={submitting || alreadySelected}
                      className={styles.selectButton} // ★ ボタンクラス適用
                    >
                      {submitting
                        ? "送信中..."
                        : alreadySelected
                          ? "選択済み"
                          : "これを選ぶ"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
};

export default GiftPage;
