import { NextResponse } from "next/server";

// とりあえずGETメソッドだけexportしておく（中身は空でOK）
export async function GET() {
  return NextResponse.json({ message: "This is a placeholder API route." });
}

// 必要であれば他のメソッド（POSTなど）も同様に追加できます
// export async function POST() {
//   return NextResponse.json({ message: "Placeholder POST" });
// }
