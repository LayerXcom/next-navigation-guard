import { test, expect } from "@playwright/test";

test.describe("Navigation Guard - Pages Router link clicks", () => {
  test("should run a button's own click handler inside a link when the guard is enabled", async ({
    page,
  }) => {
    await page.goto("/pages-router/page1");
    await expect(
      page.locator("text=Current Page: pagesRouter 1")
    ).toBeVisible();

    await page
      .getByRole("checkbox", { name: "Enable Navigation Guard" })
      .check();

    const dialogs: string[] = [];
    page.on("dialog", (dialog) => {
      dialogs.push(dialog.message());
      dialog.dismiss();
    });

    await page.getByRole("button", { name: "Open row menu" }).click();

    await expect(page.locator("text=Row menu open")).toBeVisible();
    await expect(page).toHaveURL("/pages-router/page1");
    expect(dialogs).toEqual([]);
  });
});
