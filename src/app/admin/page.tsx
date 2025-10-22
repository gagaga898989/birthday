"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { twMerge } from "tailwind-merge";

// --- 型定義 ---
type User = {
  id: string;
  email: string;
  birthday: string | null; // APIからは文字列で来る想定
  isAdmin: boolean;
  createdAt: string; // APIからは文字列で来る想定
};

type Gift = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  createdAt: string; // APIからは文字列で来る想定
};

// GiftSelection の型定義
type GiftSelection = {
  id: string; // 選択レコード自体のID
  userId: string;
  giftId: string;
  createdAt: string; // APIからは文字列で来る想定
  user: {
    // 関連ユーザー情報
    email: string;
  };
  gift: {
    // 関連ギフト情報
    name: string;
  };
};
// --- 型定義ここまで ---

const AdminPage: React.FC = () => {
  // --- State定義 ---
  const [users, setUsers] = useState<User[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [giftSelections, setGiftSelections] = useState<GiftSelection[]>([]);
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

  // 解除処理用の State
  const [deletingSelectionId, setDeletingSelectionId] = useState<string | null>(
    null
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // --- State定義ここまで ---

  // --- データ取得関数 ---
  const fetchData = async () => {
    // ローディング表示は初回のみにしたいので、ここでは setLoading(true) しない
    setError(null); // エラーメッセージをリセット
    setDeleteError(null); // 削除エラーもリセット

    // ログイン状態と管理者権限の確認 (クライアントサイド)
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.replace("/login"); // 未ログインならログインページへ
      return;
    }
    // ここでさらに管理者かどうかを確認するロジックを追加できます
    // 例: APIに /api/auth/check-admin のようなエンドポイントを作り、
    // fetch('/api/auth/check-admin').then(res => if (!res.ok) router.replace('/'))
    // API側ではDBのisAdminフラグを確認する

    try {
      // APIからデータを並行して取得
      const [usersRes, giftsRes, selectionsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/gifts"),
        fetch("/api/admin/gift-selections"), // ギフト選択状況API
      ]);

      // --- 各APIレスポンスのチェック ---
      if (!usersRes.ok) {
        // 401 Unauthorized または 403 Forbidden の場合はログインページへ
        if (usersRes.status === 401 || usersRes.status === 403) {
          setError("ユーザー情報の取得権限がありません。");
          router.replace("/login");
          return;
        }
        throw new Error(`Failed to fetch users: ${usersRes.statusText}`);
      }
      if (!giftsRes.ok) {
        if (giftsRes.status === 401 || giftsRes.status === 403) {
          setError("ギフト情報の取得権限がありません。");
          router.replace("/login");
          return;
        }
        throw new Error(`Failed to fetch gifts: ${giftsRes.statusText}`);
      }
      if (!selectionsRes.ok) {
        if (selectionsRes.status === 401 || selectionsRes.status === 403) {
          setError("ギフト選択状況の取得権限がありません。");
          router.replace("/login");
          return;
        }
        throw new Error(
          `Failed to fetch gift selections: ${selectionsRes.statusText}`
        );
      }
      // --- チェックここまで ---

      const usersData = await usersRes.json();
      const giftsData = await giftsRes.json();
      const selectionsData = await selectionsRes.json();

      setUsers(usersData);
      setGifts(giftsData);
      setGiftSelections(selectionsData); // 選択状況をstateにセット
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "データの取得中にエラーが発生しました。"
      );
      // 必要であればエラー時にログインページに戻すなどの処理を追加
      // router.replace("/login");
    } finally {
      // ローディング終了は初回のみ
      if (loading) setLoading(false);
    }
  };
  // --- データ取得関数ここまで ---

  // --- 初回データ取得 ---
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, supabase]); // router と supabase の変更時に再実行 (基本的には初回のみ)
  // --- 初回データ取得ここまで ---

  // --- ギフト作成フォーム送信処理 ---
  const handleGiftSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingGift(true);
    setSubmitGiftError(null);
    setSubmitGiftSuccess(null);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/admin/gifts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`, // 認証トークン付与
        },
        body: JSON.stringify({
          name: newGiftName,
          description: newGiftDescription,
          imageUrl: newGiftImageUrl || null,
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
      fetchData(); // 登録後に全データを再取得してリストを更新

      // 成功メッセージを数秒後に消す (任意)
      setTimeout(() => setSubmitGiftSuccess(null), 3000);
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
  // --- ギフト作成フォーム送信処理ここまで ---

  // --- ギフト選択解除処理 ---
  const handleCancelSelection = async (
    selectionId: string,
    userEmail: string,
    giftName: string
  ) => {
    if (deletingSelectionId) return; // 他の解除処理中は実行しない

    const confirmed = window.confirm(
      `ユーザー "${userEmail}" のギフト「${giftName}」の選択を解除しますか？`
    );

    if (confirmed) {
      setDeletingSelectionId(selectionId); // 解除処理中のIDをセット
      setDeleteError(null);

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session) {
          throw new Error("Not authenticated");
        }

        const response = await fetch("/api/admin/gift-selections", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`, // 認証トークン
          },
          body: JSON.stringify({ id: selectionId }), // 削除対象のIDをボディで送信
        });

        if (!response.ok) {
          // 204 No Content 以外はエラーとする
          if (response.status !== 204) {
            const errorData = await response.json().catch(() => ({})); // エラーボディが空の場合も考慮
            throw new Error(
              errorData.error ||
                `Failed to delete selection: ${response.statusText}`
            );
          }
        }

        // 成功した場合 (204 No Content でもここに来る)
        // state から直接削除する
        setGiftSelections((prevSelections) =>
          prevSelections.filter((sel) => sel.id !== selectionId)
        );
        // または fetchData(); // APIから再取得する場合
      } catch (err) {
        console.error("Deletion failed:", err);
        setDeleteError(
          err instanceof Error
            ? err.message
            : "選択の解除中にエラーが発生しました。"
        );
      } finally {
        setDeletingSelectionId(null); // 解除処理中のIDをリセット
      }
    }
  };
  // --- ギフト選択解除処理ここまで ---

  // --- ローディング・エラー表示 ---
  if (loading) {
    return (
      <main className="p-4">
        <h1 className="mb-4 text-2xl font-bold">管理者画面</h1>
        <p>読み込み中...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-4">
        <h1 className="mb-4 text-2xl font-bold">管理者画面</h1>
        <p className="rounded border border-red-400 bg-red-100 p-4 text-red-700">
          エラー: {error}
        </p>
      </main>
    );
  }
  // --- ローディング・エラー表示ここまで ---

  // --- メインコンテンツ ---
  return (
    <main className="p-4 md:p-6">
      <h1 className="mb-6 text-3xl font-bold">管理者画面</h1>

      {/* --- ギフト選択状況セクション --- */}
      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">ギフト選択状況</h2>
        {/* 削除エラー表示 */}
        {deleteError && (
          <p className="mb-3 rounded border border-red-400 bg-red-100 p-2 text-sm text-red-700">
            {deleteError}
          </p>
        )}
        {giftSelections.length === 0 ? (
          <p className="text-gray-500">まだ誰もギフトを選択していません。</p>
        ) : (
          <div className="overflow-x-auto rounded border shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    選択日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    ユーザーEmail
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    選択したギフト
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    操作 {/* 操作列 */}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {giftSelections.map((selection) => (
                  <tr key={selection.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {new Date(selection.createdAt).toLocaleString("ja-JP")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {selection.user.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {selection.gift.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      {/* 解除ボタン */}
                      <button
                        onClick={() =>
                          handleCancelSelection(
                            selection.id,
                            selection.user.email,
                            selection.gift.name
                          )
                        }
                        disabled={deletingSelectionId === selection.id} // 処理中のボタンは無効化
                        className="rounded bg-red-500 px-3 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {deletingSelectionId === selection.id
                          ? "解除中..."
                          : "解除"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {/* --- ギフト選択状況セクションここまで --- */}

      {/* --- ユーザー一覧セクション --- */}
      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">ユーザー一覧</h2>
        {users.length === 0 ? (
          <p className="text-gray-500">ユーザーが見つかりません。</p>
        ) : (
          <div className="overflow-x-auto rounded border shadow">
            <table className="min-w-full divide-y divide-gray-200">
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
                  {/* 必要であればアクション列を追加 */}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {user.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {user.birthday
                        ? new Date(user.birthday).toLocaleDateString("ja-JP")
                        : "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {user.isAdmin ? "✔️" : "❌"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString("ja-JP")}
                    </td>
                    {/* 必要であれば編集ボタンなどを追加 */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {/* --- ユーザー一覧セクションここまで --- */}

      {/* --- ギフト管理セクション --- */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold">ギフト管理</h2>

        {/* ギフト登録フォーム */}
        <form
          onSubmit={handleGiftSubmit}
          className="mb-6 rounded border bg-white p-4 shadow"
        >
          <h3 className="mb-3 text-lg font-medium">新しいギフトを登録</h3>
          {submitGiftError && (
            <p className="mb-3 rounded border border-red-400 bg-red-100 p-2 text-sm text-red-700">
              {submitGiftError}
            </p>
          )}
          {submitGiftSuccess && (
            <p className="mb-3 rounded border border-green-400 bg-green-100 p-2 text-sm text-green-700">
              {submitGiftSuccess}
            </p>
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
              placeholder="素敵なギフト"
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
              placeholder="ギフトの詳細な説明を入力してください"
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
              placeholder="https://example.com/image.jpg"
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
        {/* ギフト登録フォームここまで */}

        {/* ギフト一覧 */}
        <h3 className="mb-3 text-lg font-medium">登録済みギフト一覧</h3>
        {gifts.length === 0 ? (
          <p className="text-gray-500">ギフトが見つかりません。</p>
        ) : (
          <div className="overflow-x-auto rounded border shadow">
            <table className="min-w-full divide-y divide-gray-200">
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
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    操作
                  </th>
                  {/* 操作列 */}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {gifts.map((gift) => (
                  <tr key={gift.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {gift.name}
                    </td>
                    <td
                      className="max-w-xs truncate px-6 py-4 text-sm text-gray-500"
                      title={gift.description}
                    >
                      {gift.description}
                    </td>
                    <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-500">
                      {gift.imageUrl || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(gift.createdAt).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      {/* 必要であれば編集・削除ボタンを追加 */}
                      {/* <button className="text-indigo-600 hover:text-indigo-900 mr-2">編集</button> */}
                      {/* <button className="text-red-600 hover:text-red-900">削除</button> */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* ギフト一覧ここまで */}
      </section>
      {/* --- ギフト管理セクションここまで --- */}
    </main>
  );
  // --- メインコンテンツここまで ---
};

export default AdminPage;
