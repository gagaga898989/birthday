"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // useRouter をインポート
import { createClient } from "@/utils/supabase/client";

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
  const router = useRouter(); // useRouter を初期化
  const supabase = createClient();

  useEffect(() => {
    const fetchGifts = async () => {
      setLoading(true);
      setError(null);
      setSubmitMessage(null); // メッセージをリセット

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
        const response = await fetch("/api/admin/gifts"); // ギフト一覧取得API (要認証)

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

        // ユーザーが既に選択済みか確認するAPIを呼び出す (仮)
        // 本来は GET /api/gift-selection を実装
        try {
          const selectionRes = await fetch("/api/gift-selection"); // このAPIはまだ作成していないので仮
          if (selectionRes.ok) {
            const selectionData = await selectionRes.json();
            if (selectionData && selectionData.giftId) {
              setAlreadySelected(true);
              setSubmitMessage("すでにギフトを選択済みです。");
            }
          } else if (selectionRes.status !== 404) {
            console.error(
              "Failed to check existing selection:",
              selectionRes.statusText
            );
          }
        } catch (selectionError) {
          console.error("Error checking existing selection:", selectionError);
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
  }, []);

  // ギフト選択処理
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
          // --- ★成功した場合、完了ページへリダイレクト ---
          router.push("/gift-selected");
          // setSubmitMessage(`「${gift.name}」を選択しました！`); // メッセージ表示は不要に
          // setAlreadySelected(true); // フラグ更新も不要に（ページ遷移するため）
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
      // finally 句を削除 (成功時はリダイレクトするため不要)
    }
  };

  // --- JSX部分は変更なし ---
  return (
    <main>
      <div className="text-center">
        <h1 className="text-4xl font-bold">お誕生日おめでとうございます！🎉</h1>
        <p className="mt-4 text-xl">特別なギフトをご用意しました。</p>

        {loading && <p className="mt-8">ギフトを読み込んでいます...</p>}
        {error && <p className="mt-8 text-red-500">エラー: {error}</p>}
        {/* submitMessage の表示も不要になる（ページ遷移するため） */}
        {/* {submitMessage && <p className={`mt-4 font-bold ${alreadySelected ? 'text-blue-600' : 'text-green-600'}`}>{submitMessage}</p>} */}

        {!loading && !error && (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gifts.length === 0 ? (
              <p className="col-span-full">
                現在、利用可能なギフトはありません。
              </p>
            ) : (
              gifts.map((gift) => (
                <div
                  key={gift.id}
                  className="rounded-lg border p-4 text-left shadow"
                >
                  {gift.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={gift.imageUrl}
                      alt={gift.name}
                      className="mb-3 h-40 w-full rounded object-cover"
                    />
                  )}
                  <h2 className="text-2xl font-bold">{gift.name}</h2>
                  <p className="mt-2 text-gray-600">{gift.description}</p>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handleSelectGift(gift)}
                      disabled={submitting || alreadySelected}
                      className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting
                        ? "送信中..."
                        : alreadySelected
                          ? "選択済み"
                          : "これを選ぶ"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default GiftPage;
