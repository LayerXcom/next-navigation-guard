# next-navigation-guard

You use Next.js, and you want to show "You have unsaved changes that will be lost." dialog when user leaves page?
This library is just for you!

## Demo

[https://layerxcom.github.io/next-navigation-guard/](https://layerxcom.github.io/next-navigation-guard/)

## How does it work?

- [English Slide](https://speakerdeck.com/ypresto/cancel-next-js-page-navigation-full-throttle)
- [Japanese Slide](https://speakerdeck.com/ypresto/hack-to-prevent-page-navigation-in-next-js)

## Installation

```bash
npm install next-navigation-guard
# or
yarn install next-navigation-guard
# or
pnpm install next-navigation-guard
```

- App Router: app/layout.tsx

  ```tsx
  <html lang="en">
    <body className={`${geistSans.variable} ${geistMono.variable}`}>
      <NavigationGuardProvider>{children}</NavigationGuardProvider>
    </body>
  </html>
  ```

- Page Router: page/_app.tsx

  ```tsx
  export default function MyApp({ Component, pageProps }: AppProps) {
    return (
      <NavigationGuardProvider>
        <Component {...pageProps} />
      </NavigationGuardProvider>
    );
  }
  ```

## Usage

- window.confirm()

  ```tsx
  useNavigationGuard({ enabled: form.changed, confirm: () => window.confirm("You have unsaved changes that will be lost.") })
  ```

- Custom dialog component

  ```tsx
  const navGuard = useNavigationGuard({ enabled: form.changed })

  return (
    <>
      <YourContent />

      <Dialog open={navGuard.active}>
        <DialogText>You have unsaved changes that will be lost.</DialogText>

        <DialogActions>
          <DialogButton onClick={navGuard.reject}>Cancel</DialogButton>
          <DialogButton onClick={navGuard.accept}>Discard</DialogButton>
        </DialogActions>
      </Dialog>
    </>
  )
  ```

See working example in example/ directory and its `NavigationGuardToggle` component.

## Limitations

Calls made directly through `window.history.pushState()` or
`window.history.replaceState()` do not invoke the navigation guard. If you use
either method directly, confirm the navigation yourself before calling it.

## Testing / Storybook

Pass `disableForTesting` to `NavigationGuardProvider` and the library will skip its host-environment hooks (no `popstate` / `beforeunload` / `click` listeners, no `window.history` augmentation). The App Router / Pages Router context overrides remain in place, so navigation through Next.js routers (incl. mock routers in tests) still evaluates registered guards. `useNavigationGuard` keeps registering normally, so the `enabled` predicate, the `confirm` callback, and `active` / `accept` / `reject` work as in production.

```tsx
// each guard's own confirm runs as in production
render(
  <NavigationGuardProvider disableForTesting>
    <MyComponent />
  </NavigationGuardProvider>
);
```

To bypass the confirmation UI entirely in tests (and assert which navigations were attempted), pass `mockConfirm`. It replaces every registered guard's `confirm` during evaluation; per-guard `enabled` predicates still run.

```tsx
const mockConfirm = jest.fn().mockResolvedValue(true);
render(
  <NavigationGuardProvider disableForTesting={{ mockConfirm }}>
    <MyComponent />
  </NavigationGuardProvider>
);
// drive navigation through your mock router…
expect(mockConfirm).toHaveBeenCalledWith({ to: "/foo", type: "push" });
```
