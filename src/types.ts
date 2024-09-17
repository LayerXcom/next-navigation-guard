/**
 * true will allow the navigation, false will prevent it.
 * When beforeunload event is fired, and returned Promise is async (not immediately resolved),
 * it will be treated as if it's resolved with false.
 */
export type NavigationGuard = (params: {
  to: string;
  type: "push" | "replace" | "refresh" | "popstate" | "beforeunload";
}) => boolean | Promise<boolean>;

export type RenderedState = {
  index: number;
  token: string | null; // Prevent from two unrelated index numbers used for calculating delta.
};
