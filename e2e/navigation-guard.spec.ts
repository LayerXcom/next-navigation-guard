import { test, expect, Page } from "@playwright/test";

const exampleNextVersion = require("../example/package.json").dependencies
  .next as string;
const isNext16_2 = exampleNextVersion.startsWith("16.2.");

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
      test.skip(
        routerType === "appRouter" && isNext16_2,
        "Next.js 16.2 App Router drops guarded query-only router.replace() navigations"
      );

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

// Records dialogs by type. Accepts confirm() and dismisses beforeunload so that
// an unexpected beforeunload cancels the navigation.
function recordDialogs(page: Page) {
  const counts = { confirm: 0, beforeunload: 0 };
  page.on("dialog", (dialog) => {
    if (dialog.type() === "beforeunload") {
      counts.beforeunload++;
      dialog.dismiss();
    } else {
      if (dialog.type() === "confirm") counts.confirm++;
      dialog.accept();
    }
  });
  return counts;
}

async function enableGuard(page: Page) {
  await page.getByRole("checkbox", { name: "Enable Navigation Guard" }).check();
}

async function reloadExpectingBeforeUnload(
  page: Page,
  counts: { beforeunload: number }
) {
  const before = counts.beforeunload;
  await page.evaluate(() => {
    setTimeout(() => location.reload(), 0);
  });
  await expect.poll(() => counts.beforeunload).toBe(before + 1);
}

const crossRouterCases = [
  {
    name: "App Router to Pages Router",
    startUrl: "/page1",
    startText: "Current Page: appRouter 1",
    otherLinkIndex: 1,
    otherUrl: "/pages-router/page1",
    otherText: "Current Page: pagesRouter 1",
    spaLinkIndex: 0,
    spaUrl: "/page2",
    spaText: "Current Page: appRouter 2",
  },
  {
    name: "Pages Router to App Router",
    startUrl: "/pages-router/page1",
    startText: "Current Page: pagesRouter 1",
    otherLinkIndex: 0,
    otherUrl: "/page1",
    otherText: "Current Page: appRouter 1",
    spaLinkIndex: 1,
    spaUrl: "/pages-router/page2",
    spaText: "Current Page: pagesRouter 2",
  },
];

crossRouterCases.forEach((c) => {
  test.describe(`Navigation Guard - full page load (${c.name})`, () => {
    test("should ask only once when the accepted navigation becomes a full page load", async ({
      page,
    }) => {
      await page.goto(c.startUrl);
      await expect(page.locator(`text=${c.startText}`)).toBeVisible();
      const counts = recordDialogs(page);
      await enableGuard(page);

      await page
        .getByRole("link", { name: "Page1" })
        .nth(c.otherLinkIndex)
        .click();

      await expect(page.locator(`text=${c.otherText}`)).toBeVisible();
      await expect(page).toHaveURL(c.otherUrl);
      expect(counts).toEqual({ confirm: 1, beforeunload: 0 });
    });

    test("should stay without beforeunload when the confirmation is cancelled", async ({
      page,
    }) => {
      await page.goto(c.startUrl);
      await expect(page.locator(`text=${c.startText}`)).toBeVisible();
      const counts = { confirm: 0, beforeunload: 0 };
      page.on("dialog", (dialog) => {
        if (dialog.type() === "confirm") counts.confirm++;
        if (dialog.type() === "beforeunload") counts.beforeunload++;
        dialog.dismiss();
      });
      await enableGuard(page);

      await page
        .getByRole("link", { name: "Page1" })
        .nth(c.otherLinkIndex)
        .click();

      await page.waitForTimeout(1000);
      await expect(page.locator(`text=${c.startText}`)).toBeVisible();
      await expect(page).toHaveURL(c.startUrl);
      expect(counts).toEqual({ confirm: 1, beforeunload: 0 });
    });

    test("should warn on reload after the accepted full page load is cancelled", async ({
      page,
    }) => {
      await page.goto(c.startUrl);
      await expect(page.locator(`text=${c.startText}`)).toBeVisible();
      const counts = recordDialogs(page);
      await enableGuard(page);

      // The response is a download, so the full page load is cancelled and the page stays.
      const download = page.waitForEvent("download");
      await page.getByRole("link", { name: "Download" }).click();
      await download;
      await page.waitForTimeout(500);
      await expect(page.locator(`text=${c.startText}`)).toBeVisible();
      await expect(page).toHaveURL(c.startUrl);
      expect(counts).toEqual({ confirm: 1, beforeunload: 0 });

      await reloadExpectingBeforeUnload(page, counts);
      await page.waitForTimeout(500);
      await expect(page.locator(`text=${c.startText}`)).toBeVisible();
    });

    test("should warn on reload after the accepted navigation is committed", async ({
      page,
    }) => {
      await page.goto(c.startUrl);
      await expect(page.locator(`text=${c.startText}`)).toBeVisible();
      const counts = recordDialogs(page);
      await enableGuard(page);

      await page
        .getByRole("link", { name: "Page2" })
        .nth(c.spaLinkIndex)
        .click();
      await expect(page.locator(`text=${c.spaText}`)).toBeVisible();
      await expect(page).toHaveURL(c.spaUrl);
      expect(counts).toEqual({ confirm: 1, beforeunload: 0 });

      await enableGuard(page);
      await reloadExpectingBeforeUnload(page, counts);
      await expect(page.locator(`text=${c.spaText}`)).toBeVisible();
    });
  });
});

test.describe("Navigation Guard - full page load (App Router refresh)", () => {
  test("should warn on reload after an accepted router.refresh()", async ({
    page,
  }) => {
    await page.goto("/page1");
    await expect(page.locator("text=Current Page: appRouter 1")).toBeVisible();
    const counts = recordDialogs(page);
    await enableGuard(page);

    await page.getByRole("button", { name: "router.refresh()" }).click();
    await expect.poll(() => counts.confirm).toBe(1);
    await page.waitForTimeout(500);

    await reloadExpectingBeforeUnload(page, counts);
    await expect(page.locator("text=Current Page: appRouter 1")).toBeVisible();
    expect(counts.confirm).toBe(1);
  });
});
