import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>next-navigation-guard Example</h1>

        <div>
          <ol>
            <li>
              <Link href="/page1">App Router</Link>
            </li>
          </ol>

          <ol>
            <li>
              <Link href="/pages-router/page1">Pages Router</Link>
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
}
