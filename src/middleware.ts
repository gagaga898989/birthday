import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // デバッグ用ログ: どのパスでMiddlewareが実行されたか確認
  console.log(`[Middleware] Pathname: ${request.nextUrl.pathname}`);

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Supabaseクライアントを作成
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // console.log(`[Middleware] Setting cookie: ${name}`); // デバッグ用
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // console.log(`[Middleware] Removing cookie: ${name}`); // デバッグ用
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // セッション情報を取得
  console.log("[Middleware] Getting session...");
  const {
    data: { session },
    error: sessionError, // エラーも取得
  } = await supabase.auth.getSession();
  console.log("[Middleware] Session obtained.");

  // セッション取得エラーチェック
  if (sessionError) {
    console.error("[Middleware] Error getting session:", sessionError.message);
    // エラー発生時はそのまま進むか、エラーページにリダイレクトするかなどを検討
    // return NextResponse.error(); // Internal Server Errorを返す例
  }

  // セッション状態をログに出力
  console.log(`[Middleware] Session exists: ${!!session}`);

  const { pathname } = request.nextUrl;

  // --- リダイレクトロジック ---

  // 【追加】ルートパス('/')にアクセス かつ ログイン済みの場合 → /countdown へリダイレクト
  if (session && pathname === "/") {
    console.log("[Middleware] Redirecting to /countdown (root, logged in)");
    return NextResponse.redirect(new URL("/countdown", request.url));
  }

  // ルートパス('/')にアクセス かつ 未ログインの場合 → /login へリダイレクト
  if (!session && pathname === "/") {
    console.log("[Middleware] Redirecting to /login (root, not logged in)");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 保護されたパスの定義 (ログインが必要なページ/APIルート)
  const protectedPaths = [
    "/countdown",
    "/gift",
    "/gift-selected",
    "/happy-birthday", // このページもログインが必要な場合
    "/admin",
    "/api/admin", // /api/admin/* を含む
    "/api/gift-selection",
    "/api/user/birthday",
  ];

  // 保護されたパスにアクセス かつ 未ログインの場合
  if (!session && protectedPaths.some((path) => pathname.startsWith(path))) {
    // APIルートの場合は401 Unauthorizedを返す
    if (pathname.startsWith("/api/")) {
      console.log(
        `[Middleware] Returning 401 for API path: ${pathname} (not logged in)`
      );
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    // それ以外の保護されたページはログインページへリダイレクト
    console.log(
      `[Middleware] Redirecting to /login (protected path: ${pathname}, not logged in)`
    );
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // /login ページにアクセス かつ ログイン済みの場合 → /countdown へリダイレクト
  if (session && pathname === "/login") {
    console.log(
      "[Middleware] Redirecting to /countdown (login page, already logged in)"
    );
    return NextResponse.redirect(new URL("/countdown", request.url));
  }
  // --- リダイレクトロジックここまで ---

  console.log(
    "[Middleware] No redirect condition met, returning next response."
  );
  // 上記のどのリダイレクト条件にも当てはまらない場合、
  // またはセッション更新が必要な場合に元のリクエストを処理
  return response;
}

// Middlewareを実行するパスの設定 (変更なし)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
