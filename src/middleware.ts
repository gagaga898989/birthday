import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
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
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // --- リダイレクトロジック ---
  // ルートパス('/')にアクセス かつ 未ログインの場合 → /login へリダイレクト
  if (!session && pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // /login 以外のページにアクセス かつ 未ログインの場合 → /login へリダイレクト
  // (countdown, gift, gift-selected, admin など、ログイン必須ページを追加)
  const protectedPaths = [
    "/countdown",
    "/gift",
    "/gift-selected",
    "/admin",
    "/api/admin",
    "/api/gift-selection",
  ]; // APIルートも保護
  if (!session && protectedPaths.some((path) => pathname.startsWith(path))) {
    // APIルートの場合は401を返す (任意)
    if (pathname.startsWith("/api/")) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    // それ以外の保護されたページはログインページへ
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // /login ページにアクセス かつ ログイン済みの場合 → /countdown へリダイレクト
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/countdown", request.url));
  }
  // --- リダイレクトロジックここまで ---

  // セッション更新のために元のレスポンスを返す
  return response;
}

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
