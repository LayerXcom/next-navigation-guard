import { expect, test } from "@playwright/test";

for (const { name, url, content } of [
  { name: "App Router", url: "/page1", content: "Current Page: appRouter 1" },
  {
    name: "Pages Router",
    url: "/pages-router/page1",
    content: "Current Page: pagesRouter 1",
  },
]) {
  test(`${name}: initializes with null history state`, async ({ page }) => {
    const errors: Error[] = [];
    page.on("pageerror", (error) => errors.push(error));
    await page.addInitScript(() => {
      const replaceState = history.replaceState;
      history.replaceState = function (state, unused, url) {
        // Keep the initial entry null if Next.js initializes it before the guard.
        // Restore the native method immediately; guard metadata is never removed.
        history.replaceState = replaceState;
        return replaceState.call(
          this,
          state?.__next_navigation_guard_token ? state : null,
          unused,
          url,
        );
      };
    });

    await page.goto(url);
    await expect(page.getByText(content)).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => history.state?.__next_navigation_guard_token),
      )
      .toEqual(expect.any(String));
    expect(errors).toEqual([]);
  });
}

test("App Router: treats null popstate as unmanaged history", async ({
  page,
}) => {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  await page.goto("/page1");
  await expect
    .poll(() =>
      page.evaluate(() => history.state?.__next_navigation_guard_token),
    )
    .toEqual(expect.any(String));

  await page.evaluate(() => {
    window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
  });

  await expect(page.getByText("Current Page: appRouter 1")).toBeVisible();
  expect(
    await page.evaluate(
      () => history.state.__next_navigation_guard_stack_index,
    ),
  ).toBe(0);
  expect(errors).toEqual([]);
});
