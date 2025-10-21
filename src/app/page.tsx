"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client"; // 修正

const Page: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const supabase = createClient(); // 修正

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
  }, [router, supabase]); // 修正

  return (
    <main>
      <div className="text-2xl font-bold">Loading...</div>
    </main>
  );
};

export default Page;
