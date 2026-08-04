"use client";

import { useState } from "react";

export function PushStateButton() {
  const [pushedPath, setPushedPath] = useState<string | null>(null);

  const pushState = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("pushState", "second");
    const path = `${url.pathname}${url.search}`;

    window.history.pushState({}, "", path);
    setPushedPath(path);
  };

  return (
    <div>
      <button style={{ appearance: "auto", padding: 4 }} onClick={pushState}>
        history.pushState() query
      </button>
      <div>pushState path: {pushedPath ?? "not updated"}</div>
    </div>
  );
}
