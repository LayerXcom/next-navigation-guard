"use client";

import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      style={{ appearance: "auto", padding: 4 }}
      onClick={() => router.back()}
    >
      router.back()
    </button>
  );
}
