"use client";

import { useState, useEffect, FormEvent } from "react"; // FormEvent をインポート
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { twMerge } from "tailwind-merge"; // twMerge をインポート

// --- (型定義 User, Gift は省略) ---
type User = {
  id: string;
  email: string;
  birthday: string | null;
  isAdmin: boolean;
  createdAt: string;
};

type Gift = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  createdAt: string;
};

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // ギフト作成フォーム用のstate
  const [newGiftName, setNewGiftName] = useState("");
  const [newGiftDescription, setNewGiftDescription] = useState("");
  const [newGiftImageUrl, setNewGiftImageUrl] = useState("");
  const [isSubmittingGift, setIsSubmittingGift] = useState(false);
  const [submitGiftError, setSubmitGiftError] = useState<string | null>(null);
  const [submitGiftSuccess, setSubmitGiftSuccess] = useState<string | null>(
    null
  );

  // データの取得処理 (useEffect)
  const fetchData = async () => {
    // setLoading(true); // ローディング開始は初回のみ
    setError(null);

    // ログイン状態と管理者権限の確認
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    // 管理者チェック (本番では必須)

    try {
      const [usersRes, giftsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/gifts"),
      ]);

      if (!usersRes.ok) {
        // 401 Unauthorized の場合はログインページへリダイレクト
        if (usersRes.status === 401) {
          router.replace("/login");
          return;
        }
        throw new Error(`Failed to fetch users: ${usersRes.statusText}`);
      }
      if (!giftsRes.ok) {
        if (giftsRes.status === 401) {
          router.replace("/login");
          return;
        }
        throw new Error(`Failed to fetch gifts: ${giftsRes.statusText}`);
      }

      const usersData = await usersRes.json();
      const giftsData = await giftsRes.json();

      setUsers(usersData);
      setGifts(giftsData);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      // ローディング終了は初回のみ
      if (loading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // 初回データ取得
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, supabase]); // 依存配列から loading を削除

  // ギフト作成フォームの送信処理
  const handleGiftSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingGift(true);
    setSubmitGiftError(null);
    setSubmitGiftSuccess(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/admin/gifts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Supabaseの認証トークンをヘッダーに追加
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: newGiftName,
          description: newGiftDescription,
          imageUrl: newGiftImageUrl || null, // 空文字の場合はnullを送信
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to create gift: ${response.statusText}`
        );
      }

      // 成功した場合
      setSubmitGiftSuccess("ギフトを登録しました！");
      setNewGiftName("");
      setNewGiftDescription("");
      setNewGiftImageUrl("");
      fetchData(); // ギフトリストを再取得して更新
    } catch (err) {
      console.error(err);
      setSubmitGiftError(
        err instanceof Error
          ? err.message
          : "ギフトの登録中にエラーが発生しました。"
      );
    } finally {
      setIsSubmittingGift(false);
    }
  };

  if (loading) {
    return (
      <main>
        <h1 className="mb-4 text-2xl font-bold">管理者画面</h1>
        <p>読み込み中...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <h1 className="mb-4 text-2xl font-bold">管理者画面</h1>
        <p className="text-red-500">エラー: {error}</p>
      </main>
    );
  }

  return (
    <main>
      <h1 className="mb-6 text-3xl font-bold">管理者画面</h1>

      {/* --- ユーザー一覧セクション (変更なし) --- */}
      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">ユーザー一覧</h2>
        {/* ... (ユーザーテーブルのコード) ... */}
        {users.length === 0 ? (
          <p>ユーザーが見つかりません。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    誕生日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    管理者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    登録日
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="whitespace-nowrap px-6 py-4">
                      {user.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {user.birthday
                        ? new Date(user.birthday).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {user.isAdmin ? "✔️" : "❌"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* --- ギフトセクション (ここから変更) --- */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold">ギフト管理</h2>

        {/* ギフト登録フォーム */}
        <form
          onSubmit={handleGiftSubmit}
          className="mb-6 rounded border bg-white p-4 shadow"
        >
          <h3 className="mb-3 text-lg font-medium">新しいギフトを登録</h3>
          {submitGiftError && (
            <p className="mb-3 text-sm text-red-500">{submitGiftError}</p>
          )}
          {submitGiftSuccess && (
            <p className="mb-3 text-sm text-green-500">{submitGiftSuccess}</p>
          )}
          <div className="mb-3 space-y-1">
            <label
              htmlFor="giftName"
              className="block text-sm font-medium text-gray-700"
            >
              ギフト名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="giftName"
              value={newGiftName}
              onChange={(e) => setNewGiftName(e.target.value)}
              required
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="mb-3 space-y-1">
            <label
              htmlFor="giftDescription"
              className="block text-sm font-medium text-gray-700"
            >
              説明 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="giftDescription"
              value={newGiftDescription}
              onChange={(e) => setNewGiftDescription(e.target.value)}
              required
              rows={3}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="mb-3 space-y-1">
            <label
              htmlFor="giftImageUrl"
              className="block text-sm font-medium text-gray-700"
            >
              画像URL (任意)
            </label>
            <input
              type="url"
              id="giftImageUrl"
              value={newGiftImageUrl}
              onChange={(e) => setNewGiftImageUrl(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmittingGift || !newGiftName || !newGiftDescription}
              className={twMerge(
                "rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm",
                "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              {isSubmittingGift ? "登録中..." : "ギフトを登録"}
            </button>
          </div>
        </form>

        {/* ギフト一覧 */}
        <h3 className="mb-3 text-lg font-medium">登録済みギフト一覧</h3>
        {gifts.length === 0 ? (
          <p>ギフトが見つかりません。</p>
        ) : (
          <div className="overflow-x-auto">
            {/* ... (ギフトテーブルのコードは変更なし) ... */}
            <table className="min-w-full divide-y divide-gray-200 border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    名前
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    説明
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    画像URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    登録日
                  </th>
                  {/* 編集・削除ボタン用の列を追加 */}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {gifts.map((gift) => (
                  <tr key={gift.id}>
                    <td className="whitespace-nowrap px-6 py-4">{gift.name}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {gift.description}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {gift.imageUrl || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {new Date(gift.createdAt).toLocaleDateString()}
                    </td>
                    {/* 編集・削除ボタン */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {/* --- (ここまで変更) --- */}
    </main>
  );
};

export default AdminPage;
