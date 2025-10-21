"use client";

// useEffect と useState をインポート
import { useState, useEffect } from "react";
// Gift 型定義 (必要に応じて admin ページから共通化)
type Gift = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  createdAt: string; // 必要であれば Date 型に変換
};

const GiftPage: React.FC = () => {
  // ギフトリスト、ローディング、エラー状態を管理
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGifts = async () => {
      setLoading(true);
      setError(null);
      try {
        // APIからギフトデータを取得
        const response = await fetch("/api/admin/gifts"); // 管理者APIを仮で使用

        // エラーレスポンスのハンドリング
        if (!response.ok) {
          // 認証エラーなどの場合、エラーメッセージを表示するか、
          // 適切なページ（例：ログインページ）にリダイレクト
          if (response.status === 401) {
            setError(
              "ギフト情報を取得する権限がありません。ログインしているか確認してください。"
            );
            // 必要であれば router.push('/login'); などでリダイレクト
          } else {
            throw new Error(`Failed to fetch gifts: ${response.statusText}`);
          }
          // エラー時は gifts を空にする
          setGifts([]);
          return; // これ以上処理を進めない
        }

        const data: Gift[] = await response.json();
        setGifts(data); // 取得したデータでstateを更新
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "ギフト情報の取得中にエラーが発生しました。"
        );
        setGifts([]); // エラー時は gifts を空にする
      } finally {
        setLoading(false); // ローディング完了
      }
    };

    fetchGifts();
  }, []); // 空の依存配列で、コンポーネントマウント時に一度だけ実行

  return (
    <main>
      <div className="text-center">
        <h1 className="text-4xl font-bold">お誕生日おめでとうございます！🎉</h1>
        <p className="mt-4 text-xl">特別なギフトをご用意しました。</p>

        {/* ローディング表示 */}
        {loading && <p className="mt-8">ギフトを読み込んでいます...</p>}

        {/* エラー表示 */}
        {error && <p className="mt-8 text-red-500">エラー: {error}</p>}

        {/* ギフトリスト表示 */}
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
                  {/* 画像表示 (imageUrl があれば) */}
                  {gift.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={gift.imageUrl}
                      alt={gift.name}
                      className="mb-3 h-40 w-full rounded object-cover"
                      // 本番環境では Next.js の Image コンポーネントの利用を検討
                    />
                  )}
                  <h2 className="text-2xl font-bold">{gift.name}</h2>
                  <p className="mt-2 text-gray-600">{gift.description}</p>
                  {/* 必要であれば作成日なども表示 */}
                  {/* <p className="mt-1 text-sm text-gray-400">
                     登録日: {new Date(gift.createdAt).toLocaleDateString()}
                   </p> */}
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
