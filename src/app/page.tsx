"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";

const Page: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

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
  }, [router]);

  return (
    <main>
      <div className="text-2xl font-bold">Loading...</div>
    </main>
  );
};

export default Page;
