"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "@/i18n/routing";

export default function Home() {
  const router = useRouter();
  const routerRef = useRef(router);
  const redirected = useRef(false);

  useEffect(() => {
    routerRef.current = router;
  });

  useEffect(() => {
    if (redirected.current) return;
    redirected.current = true;
    routerRef.current.replace("/dashboard");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
