import { test, expect } from "@playwright/test";

test.describe("Navigation Guard - Pages Router object hrefs", () => {
  test("should pass guards the resolved URL for an object href", async ({
    page,
  }) => {
    await page.goto("/pages-router/page2?query=first");
    await expect(
      page.locator("text=Current Page: pagesRouter 2")
    ).toBeVisible();

    await page
      .getByRole("checkbox", { name: "Guard page changes only" })
      .check();

    const dialogs: string[] = [];
    page.on("dialog", (dialog) => {
      dialogs.push(dialog.message());
      dialog.dismiss();
    });

    await page
      .getByRole("button", { name: "router.replace() query object" })
      .click();

    await expect(page).toHaveURL("/pages-router/page2?query=second");
    expect(dialogs).toEqual([]);
  });

  test("should still guard an object href to another page", async ({
    page,
  }) => {
    await page.goto("/pages-router/page2");
    await expect(
      page.locator("text=Current Page: pagesRouter 2")
    ).toBeVisible();

    await page
      .getByRole("checkbox", { name: "Guard page changes only" })
      .check();

    const dialogPromise = new Promise<string>((resolve) => {
      page.once("dialog", (dialog) => {
        resolve(dialog.message());
        dialog.dismiss();
      });
    });

    await page
      .getByRole("button", { name: "router.push() page3 object" })
      .click();

    expect(await dialogPromise).toBe("Leave this page?");
    await expect(page).toHaveURL("/pages-router/page2");
  });
});
