"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/dashboard");
  }, []);
  
  return null;
}
