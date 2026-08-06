import { test, expect, Page } from "@playwright/test";

// Helper function to wait for and handle beforeunload dialog
async function waitForBeforeUnloadDialog(
  page: Page,
  action: "accept" | "dismiss" = "dismiss"
) {
  return new Promise<void>((resolve) => {
    page.once("dialog", (dialog) => {
      expect(dialog.type()).toBe("beforeunload");

      if (action === "accept") {
        dialog.accept();
      } else {
        dialog.dismiss();
      }
      resolve();
    });
  });
}

// Define test parameters for both routers
const routers = [
  {
    name: "App Router",
    routerType: "appRouter",
    startUrl: "/page1",
    linkIndex: 0, // First set of links
    basePath: "",
  },
  {
    name: "Pages Router",
    routerType: "pagesRouter",
    startUrl: "/pages-router/page1",
    linkIndex: 1, // Second set of links
    basePath: "/pages-router",
  },
];

// Parameterized tests that run for both routers
routers.forEach(({ name, routerType, startUrl, linkIndex, basePath }) => {
  test.describe(`Navigation Guard - ${name}`, () => {
    test("should navigate freely when guard is disabled", async ({ page }) => {
      // Navigate to page1
      await page.goto(startUrl);
      await expect(
        page.locator(`text=Current Page: ${routerType} 1`)
      ).toBeVisible();

      // Navigate to page 2
      await page.getByRole("link", { name: "Page2" }).nth(linkIndex).click();
      await expect(
        page.locator(`text=Current Page: ${routerType} 2`)
      ).toBeVisible();
      await expect(page).toHaveURL(`${basePath}/page2`);

      // Navigate back to page 1 then to page 3
      await page.getByRole("link", { name: "Page1" }).nth(linkIndex).click();
      await expect(
        page.locator(`text=Current Page: ${routerType} 1`)
      ).toBeVisible();
      await expect(page).toHaveURL(`${basePath}/page1`);

      await page.getByRole("link", { name: "Page3" }).nth(linkIndex).click();
      await expect(
        page.locator(`text=Current Page: ${routerType} 3`)
      ).toBeVisible();
      await expect(page).toHaveURL(`${basePath}/page3`);
    });

    test("should show sync confirmation dialog when guard is enabled", async ({
      page,
    }) => {
      await page.goto(startUrl);
      await page.waitForSelector("text=Current Page:");

      // Enable navigation guard
      await page
        .getByRole("checkbox", { name: "Enable Navigation Guard" })
        .check();

      // Set up dialog handler
      page.on("dialog", (dialog) => {
        expect(dialog.message()).toBe(
          "You have unsaved changes that will be lost."
        );
        dialog.accept();
      });

      // Try to navigate
      await page.getByRole("link", { name: "Page2" }).nth(linkIndex).click();
      await expect(
        page.locator(`text=Current Page: ${routerType} 2`)
      ).toBeVisible();
      await expect(page).toHaveURL(`${basePath}/page2`);
    });

    test("should prevent navigation when sync confirmation is cancelled", async ({
      page,
    }) => {
      await page.goto(startUrl);
      await page.waitForSelector("text=Current Page:");

      // Set up dialog handler to cancel BEFORE enabling guard
      page.once("dialog", (dialog) => {
        expect(dialog.message()).toBe(
          "You have unsaved changes that will be lost."
        );
        dialog.dismiss();
      });

      // Enable navigation guard
      await page
        .getByRole("checkbox", { name: "Enable Navigation Guard" })
        .check();

      // Try to navigate
      await page.getByRole("link", { name: "Page2" }).nth(linkIndex).click();

      // Should still be on page 1
      await page.waitForTimeout(1000); // Give it time to not navigate
      await expect(
        page.locator(`text=Current Page: ${routerType} 1`)
      ).toBeVisible();
      await expect(page).toHaveURL(`${basePath}/page1`);
    });

    test("should show async confirmation UI when async mode is selected", async ({
      page,
    }) => {
      await page.goto(startUrl);
      await page.waitForSelector("text=Current Page:");

      // Enable navigation guard and select async mode
      await page
        .getByRole("checkbox", { name: "Enable Navigation Guard" })
        .check();
      await page.getByRole("checkbox", { name: "Use Async Confirm" }).check();

      // Try to navigate
      await page.getByRole("link", { name: "Page2" }).nth(linkIndex).click();

      // Check that confirmation UI appears
      await expect(
        page.locator("text=You have unsaved changes that will be lost.")
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "OK" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
    });

    test("should navigate when async confirmation is accepted", async ({
      page,
    }) => {
      await page.goto(startUrl);
      await page.waitForSelector("text=Current Page:");

      // Enable navigation guard and select async mode
      await page
        .getByRole("checkbox", { name: "Enable Navigation Guard" })
        .check();
      await page.getByRole("checkbox", { name: "Use Async Confirm" }).check();

      // Try to navigate
      await page.getByRole("link", { name: "Page2" }).nth(linkIndex).click();

      // Accept the confirmation
      await page.getByRole("button", { name: "OK" }).click();

      // Should navigate to page 2
      await expect(
        page.locator(`text=Current Page: ${routerType} 2`)
      ).toBeVisible();
      await expect(page).toHaveURL(`${basePath}/page2`);
    });

    test("should prevent navigation when async confirmation is cancelled", async ({
      page,
    }) => {
      await page.goto(startUrl);
      await page.waitForSelector("text=Current Page:");

      // Enable navigation guard and select async mode
      await page
        .getByRole("checkbox", { name: "Enable Navigation Guard" })
        .check();
      await page.getByRole("checkbox", { name: "Use Async Confirm" }).check();

      // Try to navigate
      await page.getByRole("link", { name: "Page2" }).nth(linkIndex).click();

      // Cancel the confirmation
      await page.getByRole("button", { name: "Cancel" }).click();

      // Should still be on page 1
      await page.waitForTimeout(1000);
      await expect(
        page.locator(`text=Current Page: ${routerType} 1`)
      ).toBeVisible();
      await expect(page).toHaveURL(`${basePath}/page1`);
    });

    test("should guard browser back button navigation", async ({ page }) => {
      // Navigate to page2 first
      await page.goto(startUrl);
      await page.getByRole("link", { name: "Page2" }).nth(linkIndex).click();
      await expect(
        page.locator(`text=Current Page: ${routerType} 2`)
      ).toBeVisible();

      // Enable navigation guard
      await page
        .getByRole("checkbox", { name: "Enable Navigation Guard" })
        .check();

      // Set up dialog handler to cancel
      page.once("dialog", (dialog) => {
        expect(dialog.message()).toBe(
          "You have unsaved changes that will be lost."
        );
        dialog.dismiss();
      });

      // Try to go back using browser back button
      await page.goBack();

      // Should still be on page 2
      await page.waitForTimeout(1000);
      await expect(
        page.locator(`text=Current Page: ${routerType} 2`)
      ).toBeVisible();
      await expect(page).toHaveURL(`${basePath}/page2`);
    });

    test("should guard browser forward button navigation", async ({ page }) => {
      // Navigate to page2 then back to page1
      await page.goto(startUrl);
      await page.getByRole("link", { name: "Page2" }).nth(linkIndex).click();
      await expect(
        page.locator(`text=Current Page: ${routerType} 2`)
      ).toBeVisible();

      await page.goBack();
      await expect(
        page.locator(`text=Current Page: ${routerType} 1`)
      ).toBeVisible();
      await expect(page).toHaveURL(`${basePath}/page1`);

      // Enable navigation guard
      await page
        .getByRole("checkbox", { name: "Enable Navigation Guard" })
        .check();

      // Set up dialog handler to cancel
      page.once("dialog", (dialog) => {
        expect(dialog.message()).toBe(
          "You have unsaved changes that will be lost."
        );
        dialog.dismiss();
      });

      // Try to go forward using browser forward button
      await page.goForward();

      // Should still be on page 1
      await page.waitForTimeout(1000);
      await expect(
        page.locator(`text=Current Page: ${routerType} 1`)
      ).toBeVisible();
      await expect(page).toHaveURL(`${basePath}/page1`);
    });

    test("should guard router.back() navigation", async ({ page }) => {
      // Navigate to page2 first
      await page.goto(startUrl);
      await page.getByRole("link", { name: "Page2" }).nth(linkIndex).click();
      await expect(
        page.locator(`text=Current Page: ${routerType} 2`)
      ).toBeVisible();

      // Enable navigation guard
      await page
        .getByRole("checkbox", { name: "Enable Navigation Guard" })
        .check();

      // Set up dialog handler to cancel
      page.once("dialog", (dialog) => {
        expect(dialog.message()).toBe(
          "You have unsaved changes that will be lost."
        );
        dialog.dismiss();
      });

      // Try to go back using router.back() button
      await page.getByRole("button", { name: "router.back()" }).click();

      // Should still be on page 2
      await page.waitForTimeout(1000);
      await expect(
        page.locator(`text=Current Page: ${routerType} 2`)
      ).toBeVisible();
      await expect(page).toHaveURL(`${basePath}/page2`);
    });

    test("should guard router.forward() navigation", async ({ page }) => {
      // Navigate to page2 then back to page1
      await page.goto(startUrl);
      await page.getByRole("link", { name: "Page2" }).nth(linkIndex).click();
      await expect(
        page.locator(`text=Current Page: ${routerType} 2`)
      ).toBeVisible();

      await page.getByRole("button", { name: "router.back()" }).click();
      await expect(
        page.locator(`text=Current Page: ${routerType} 1`)
      ).toBeVisible();
      await expect(page).toHaveURL(`${basePath}/page1`);

      // Enable navigation guard
      await page
        .getByRole("checkbox", { name: "Enable Navigation Guard" })
        .check();

      // Set up dialog handler to cancel
      page.once("dialog", (dialog) => {
        expect(dialog.message()).toBe(
          "You have unsaved changes that will be lost."
        );
        dialog.dismiss();
      });

      // Try to go forward using router.forward() button
      await page.getByRole("button", { name: "router.forward()" }).click();

      // Should still be on page 1
      await page.waitForTimeout(1000);
      await expect(
        page.locator(`text=Current Page: ${routerType} 1`)
      ).toBeVisible();
      await expect(page).toHaveURL(`${basePath}/page1`);
    });

    test("should guard query parameter changes through router.replace()", async ({
      page,
    }) => {
      await page.goto(`${startUrl}?query=first`);
      await expect(
        page.locator(`text=Current Page: ${routerType} 1`)
      ).toBeVisible();

      await page
        .getByRole("checkbox", { name: "Enable Navigation Guard" })
        .check();

      const dialogPromise = new Promise<void>((resolve) => {
        page.once("dialog", (dialog) => {
          expect(dialog.message()).toBe(
            "You have unsaved changes that will be lost."
          );
          dialog.accept();
          resolve();
        });
      });

      await page.waitForTimeout(500);
      await page
        .getByRole("button", { name: "router.replace() query" })
        .click();
      await dialogPromise;

      await expect(
        page.locator(`text=Current Page: ${routerType} 1`)
      ).toBeVisible();
      await expect(page).toHaveURL(`${basePath}/page1?query=second`);
    });

    test("should guard page changes through history.pushState()", async ({
      page,
    }) => {
      await page.goto(`${startUrl}?query=first`);
      await expect(
        page.locator(`text=Current Page: ${routerType} 1`)
      ).toBeVisible();

      await page
        .getByRole("checkbox", { name: "Enable Navigation Guard" })
        .check();

      const dialogPromise = new Promise<void>((resolve) => {
        page.once("dialog", (dialog) => {
          expect(dialog.message()).toBe(
            "You have unsaved changes that will be lost."
          );
          dialog.accept();
          resolve();
        });
      });

      await page.getByRole("button", { name: "history.pushState() page" }).click();
      await dialogPromise;

      const pushedPath = `${basePath}/page3?query=first&pushState=second`;
      await expect(page.getByText(`pushState path: ${pushedPath}`)).toBeVisible();
      await expect(page).toHaveURL(pushedPath);
    });

    test("should guard page refresh", async ({ page }) => {
      await page.goto(startUrl);

      // Enable navigation guard
      await page
        .getByRole("checkbox", { name: "Enable Navigation Guard" })
        .check();

      // Set up dialog handler to cancel
      page.once("dialog", (dialog) => {
        expect(dialog.message()).toBe(
          "You have unsaved changes that will be lost."
        );
        dialog.dismiss();
      });

      // Try to refresh using router.refresh() button
      await page.getByRole("button", { name: "router.refresh()" }).click();

      // Should still be on the same page with guard enabled
      await page.waitForTimeout(1000);
      await expect(
        page.locator(`text=Current Page: ${routerType} 1`)
      ).toBeVisible();
      await expect(page).toHaveURL(startUrl);
      await expect(
        page.getByRole("checkbox", { name: "Enable Navigation Guard" })
      ).toBeChecked();
    });

    test("should guard tab close/navigation away", async ({ page }) => {
      await page.goto(startUrl);

      // Enable navigation guard
      await page
        .getByRole("checkbox", { name: "Enable Navigation Guard" })
        .check();

      // Test navigation to external URL
      const dialogPromise = waitForBeforeUnloadDialog(page, "dismiss");

      // Start navigation but don't await it
      const navigationPromise = page
        .goto("https://example.com", { waitUntil: "commit" })
        .catch(() => {
          // Navigation will be cancelled, so we catch the error
        });

      // Wait for dialog to be handled
      await dialogPromise;

      // Wait a bit for navigation to be cancelled
      await page.waitForTimeout(500);

      // Should still be on the original page
      await expect(
        page.locator(`text=Current Page: ${routerType} 1`)
      ).toBeVisible();
      await expect(page).toHaveURL(startUrl);

      // Test closing tab/window
      // Note: We can't actually test page.close() as it will close the page
      // Instead, we'll test that beforeunload dialog appears when trying to close
      // This is typically tested manually or with browser-specific APIs

      // Test navigation via window.location
      const dialogPromise2 = waitForBeforeUnloadDialog(page, "dismiss");
      await page.evaluate(() => {
        window.location.href = "https://example.com";
      });
      await dialogPromise2;

      // Should still be on the original page
      await page.waitForTimeout(500);
      await expect(
        page.locator(`text=Current Page: ${routerType} 1`)
      ).toBeVisible();
      await expect(page).toHaveURL(startUrl);
    });

    test("should allow navigation when guard accepts all navigation types", async ({
      page,
    }) => {
      // Test browser back
      await page.goto(startUrl);
      await page.getByRole("link", { name: "Page2" }).nth(linkIndex).click();
      await expect(
        page.locator(`text=Current Page: ${routerType} 2`)
      ).toBeVisible();

      await page
        .getByRole("checkbox", { name: "Enable Navigation Guard" })
        .check();

      page.once("dialog", (dialog) => {
        dialog.accept();
      });

      await page.goBack();
      await expect(
        page.locator(`text=Current Page: ${routerType} 1`)
      ).toBeVisible();
      await expect(page).toHaveURL(`${basePath}/page1`);

      // Test router.forward()
      page.once("dialog", (dialog) => {
        dialog.accept();
      });

      await page.getByRole("button", { name: "router.forward()" }).click();
      await expect(
        page.locator(`text=Current Page: ${routerType} 2`)
      ).toBeVisible();
      await expect(page).toHaveURL(`${basePath}/page2`);
    });
  });
});
