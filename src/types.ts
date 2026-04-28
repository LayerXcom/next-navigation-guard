export interface NavigationGuardOptions {
  /** @default true */
  enabled?: boolean | ((params: NavigationGuardParams) => boolean);
  confirm?: NavigationGuardCallback;
}

/**
 * When set on `NavigationGuardProvider`, the library does not touch any host
 * environment for navigation interception. Intended for unit tests and
 * storybook where mocking `window`/`history`/Next.js internals is undesired.
 *
 * What it disables (library-side hooks into the environment):
 * - registering `popstate`, `beforeunload`, and capture-phase `click` listeners
 * - augmenting `window.history` (token / stack-index injection)
 * - overriding Next.js App Router and Pages Router contexts
 * - the click-link interceptor that ships for Next.js 15.3+
 *
 * What it intentionally leaves alone (user component contract):
 * - the `enabled` predicate passed to `useNavigationGuard`
 * - the `confirm` callback
 * - the `active` / `accept` / `reject` state used by custom confirmation UIs
 *
 * In other words: `useNavigationGuard` keeps registering and behaving as a
 * normal hook; only the library's bridge to the real navigation events is
 * inert. Tests that need to drive guard evaluation should do so through the
 * user component's own surface (e.g. mock `confirm` and assert on `active`).
 */
export type DisableForTesting = boolean;

export interface NavigationGuardParams {
  to: string;
  type: "push" | "replace" | "refresh" | "popstate" | "beforeunload";
}

/**
 * true will allow the navigation, false will prevent it.
 * When beforeunload event is fired, and returned Promise is async (not immediately resolved),
 * it will be treated as if it's resolved with false.
 */
export type NavigationGuardCallback = (
  params: NavigationGuardParams
) => boolean | Promise<boolean>;

export interface GuardDef {
  enabled: (params: NavigationGuardParams) => boolean;
  callback: NavigationGuardCallback;
}

export interface RenderedState {
  index: number;
  token: string | null; // Prevent from two unrelated index numbers used for calculating delta.
}
