"use client";

import { useRouter } from "next/navigation";

export function RefreshButton() {
  const router = useRouter();
  return (
    <button
      style={{ appearance: "auto", padding: 4 }}
      onClick={() => router.refresh()}
    >
      router.refresh()
    </button>
  );
}
