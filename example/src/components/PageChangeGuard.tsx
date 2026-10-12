import { useRouter } from "next/router";
import { useNavigationGuard } from "next-navigation-guard";
import { useState } from "react";

const pathOf = (url: string) => url.split(/[?#]/)[0];

// A guard that only cares about leaving the page, so it lets query-only changes through,
// paired with a Pages Router query change made with an object href.
export function PageChangeGuard() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);

  useNavigationGuard({
    enabled: ({ to }) => enabled && pathOf(to) !== pathOf(router.asPath),
    confirm: () => window.confirm("Leave this page?"),
  });

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        &nbsp; Guard page changes only
      </label>{" "}
      <button
        style={{ appearance: "auto", padding: 4 }}
        onClick={() =>
          router.replace({
            pathname: router.pathname,
            query: { ...router.query, query: "second" },
          })
        }
      >
        router.replace() query object
      </button>{" "}
      <button
        style={{ appearance: "auto", padding: 4 }}
        onClick={() => router.push({ pathname: "/pages-router/page3" })}
      >
        router.push() page3 object
      </button>
    </div>
  );
}
