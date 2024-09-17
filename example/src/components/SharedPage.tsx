import Link from "next/link";
import styles from "../app/page.module.css";
import { RefreshButton } from "./RefreshButton";
import { NavigationGuardToggle } from "./NavigationGuardToggle";
import { BackButton } from "./BackButton";
import { ForwardButton } from "./ForwardButton";

export function SharedPage({
  current,
  mode,
}: {
  current: number;
  mode: "appRouter" | "pagesRouter";
}) {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Navigation Guard Example</h1>
        <div>
          Current Page: {mode} {current}
        </div>
        <div style={{ display: "flex", gap: 48 }}>
          <div>
            <div style={{ marginBottom: 16 }}>App Router</div>
            <ol>
              <li>
                <Link href="/page1">Page1</Link>
              </li>
              <li>
                <Link href="/page2">Page2</Link>
              </li>
              <li>
                <Link href="/page3">Page3</Link>
              </li>
            </ol>
          </div>
          <div>
            <div style={{ marginBottom: 16 }}>Pages Router</div>
            <ol>
              <li>
                <Link href="/pages-router/page1">Page1</Link>
              </li>
              <li>
                <Link href="/pages-router/page2">Page2</Link>
              </li>
              <li>
                <Link href="/pages-router/page3">Page3</Link>
              </li>
            </ol>
          </div>
        </div>

        <div>
          <NavigationGuardToggle confirm="You have unsaved changes that will be lost." />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span>
            <RefreshButton />
          </span>
          <span>
            <BackButton />
          </span>
          <span>
            <ForwardButton />
          </span>
        </div>
      </main>
    </div>
  );
}
