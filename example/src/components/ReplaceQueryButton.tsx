"use client";

import { useRouter } from "next/navigation";

export function ReplaceQueryButton() {
  const router = useRouter();

  return (
    <button
      style={{ appearance: "auto", padding: 4 }}
      onClick={() => {
        const url = new URL(window.location.href);
        url.searchParams.set("query", "second");
        router.replace(`${url.pathname}${url.search}`);
      }}
    >
      router.replace() query
    </button>
  );
}
