"use client";

// useEffect, useState, useRouter, createClient のインポートは不要になる場合があります
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { createClient } from "@/utils/supabase/client";

const Page: React.FC = () => {
  // const router = useRouter();
  // const [loading, setLoading] = useState(true);
  // const supabase = createClient();

  /* Middlewareがリダイレクトを処理するため、このuseEffectは不要
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.replace("/countdown");
      } else {
        router.replace("/login");
      }
    };

    checkUser();
    // setLoading(false); // setLoadingも不要に
  }, [router, supabase]);
  */

  // Middlewareがリダイレクトするので、ここが表示される時間はほとんどないはず
  // シンプルな表示にするか、何も表示しなくても良い
  return (
    <main>
      {<div className="text-2xl font-bold">Loading...</div>}
      {/* もしくは空にする */}
    </main>
  );
};

export default Page;
