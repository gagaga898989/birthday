"use client";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCake, faRightFromBracket } from "@fortawesome/free-solid-svg-icons"; // faRightFromBracket をインポート
import { createClient } from "@/utils/supabase/client"; // Supabase クライアントをインポート
import { useRouter } from "next/navigation"; // useRouter をインポート
import { useState, useEffect } from "react"; // useState, useEffect をインポート

const Header: React.FC = () => {
  const router = useRouter();
  const supabase = createClient();
  const [isLoggedIn, setIsLoggedIn] = useState(false); // ログイン状態を管理するstate

  useEffect(() => {
    // ログイン状態を確認
    const checkLoginStatus = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkLoginStatus();

    // 認証状態の変化を監視
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsLoggedIn(!!session);
      }
    );

    // クリーンアップ関数
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  // ログアウト処理
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login"); // ログアウト後にログインページへリダイレクト
    router.refresh(); // ページをリフレッシュ
  };

  return (
    <header>
      <div className="bg-slate-800 py-2">
        <div
          className={twMerge(
            "mx-4 max-w-2xl md:mx-auto",
            "flex items-center justify-between",
            "text-lg font-bold text-white"
          )}
        >
          <div>
            <FontAwesomeIcon icon={faCake} className="mr-1" />
            Header
          </div>
          <div className="flex items-center space-x-4">
            <div>About</div>
            {/* ログイン状態に応じてログアウトボタンを表示 */}
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="text-sm text-gray-300 hover:text-white"
                title="ログアウト"
              >
                <FontAwesomeIcon icon={faRightFromBracket} />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
