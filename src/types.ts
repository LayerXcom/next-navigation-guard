export interface NavigationGuardOptions {
  /** @default true */
  enabled?: boolean | ((params: NavigationGuardParams) => boolean);
  confirm?: NavigationGuardCallback;
}

/**
 * When set on `NavigationGuardProvider`, the library skips its host-environment
 * hooks. Intended for unit tests and storybook where touching real `window` /
 * `history` / `document` is undesired.
 *
 * What it disables (host-environment side):
 * - `popstate`, `beforeunload`, and capture-phase `click` listeners
 * - `window.history` augmentation (token / stack-index injection)
 * - the click-link interceptor that ships for Next.js 15.3+
 *
 * What it intentionally leaves alone (user component contract):
 * - the `enabled` predicate passed to `useNavigationGuard`
 * - the `confirm` callback
 * - the `active` / `accept` / `reject` state used by custom confirmation UIs
 * - the App Router / Pages Router `RouterContext` overrides — navigation
 *   driven through Next.js routers (including mock routers in tests) still
 *   evaluates registered guards
 *
 * Two forms:
 * - `true`: each guard's own `confirm` runs as in production.
 * - `{ mockConfirm }`: the supplied callback replaces every guard's `confirm`
 *   during evaluation, so tests can drive accept/reject deterministically
 *   (e.g. `jest.fn().mockResolvedValue(true)`) without rendering the
 *   confirmation UI. Per-guard `enabled` predicates are still evaluated.
 */
export type DisableForTesting = boolean | { mockConfirm: NavigationGuardCallback };

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
