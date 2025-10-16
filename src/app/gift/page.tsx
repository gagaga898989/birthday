"use client";

const GiftPage: React.FC = () => {
  // ここにギフトカタログの情報を表示するロジックを実装します。
  // 例えば、Prismaを使ってデータベースから商品情報を取得するなど。

  return (
    <main>
      <div className="text-center">
        <h1 className="text-4xl font-bold">お誕生日おめでとうございます！</h1>
        <p className="mt-4 text-xl">特別なギフトをご用意しました。</p>

        {/* ギフトのリストなどをここに表示 */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* サンプルギフト */}
          <div className="rounded-lg border p-4">
            <h2 className="text-2xl font-bold">素敵なギフト 1</h2>
            <p>商品説明が入ります。</p>
          </div>
          <div className="rounded-lg border p-4">
            <h2 className="text-2xl font-bold">素敵なギフト 2</h2>
            <p>商品説明が入ります。</p>
          </div>
          <div className="rounded-lg border p-4">
            <h2 className="text-2xl font-bold">素敵なギフト 3</h2>
            <p>商品説明が入ります。</p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default GiftPage;
