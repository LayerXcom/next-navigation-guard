"use client";

import { useRouter } from "next/navigation";

export function ForwardButton() {
  const router = useRouter();
  return (
    <button
      style={{ appearance: "auto", padding: 4 }}
      onClick={() => router.forward()}
    >
      router.forward()
    </button>
  );
}
