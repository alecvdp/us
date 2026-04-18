"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

const REFRESH_INTERVAL_MS = 30_000; // 30 seconds

export default function AutoRefresh() {
  const router = useRouter();

  const refresh = useCallback(() => {
    if (document.visibilityState === "visible") {
      router.refresh();
    }
  }, [router]);

  useEffect(() => {
    const id = setInterval(refresh, REFRESH_INTERVAL_MS);

    function handleVisibility() {
      if (document.visibilityState === "visible") router.refresh();
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [router, refresh]);

  return null;
}
