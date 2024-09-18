export interface NavigationGuardOptions {
  /** @default true */
  enabled?: boolean | ((params: NavigationGuardParams) => boolean);
  confirm?: NavigationGuardCallback;
}

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
