import Link from "next/link";
import React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";

let _basePath: string | null = null;

/**
 * Next AppRouter doesn't expose basePath programatically.
 * One hacky way that we can determine it, however, is to render a <Link />
 * and examine the resulting href.
 */
function getBasePath() {
  if (_basePath !== null) return _basePath;
  const link = <Link href="/" />;

  const el = document.createElement("div");
  const root = createRoot(el);
  flushSync(() => root.render(link));

  const anchor = el.querySelector("a");
  _basePath = anchor?.getAttribute("href") ?? "";
  return _basePath;
}

/**
 * Strips the NextJS basePath from a route.
 * @param href A route path (i.e. should not include a hostname or "https://")
 */
export function stripBasePath(href: string) {
  const basePath = getBasePath();
  if (!basePath || basePath === "/") return href;
  return href.replace(basePath, "") || "/";
}
