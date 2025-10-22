// 新規作成: src/app/gift-selected/page.tsx
import Link from "next/link";

const GiftSelectedPage: React.FC = () => {
  return (
    <main>
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h1 className="mb-4 text-3xl font-bold text-green-600">
          ギフトをお選びいただき、ありがとうございます！
        </h1>
        <p className="mb-8 text-lg">素敵な誕生日になりますように 🎉</p>
        <Link
          href="/"
          className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
        >
          トップページへ戻る
        </Link>
      </div>
    </main>
  );
};

export default GiftSelectedPage;
