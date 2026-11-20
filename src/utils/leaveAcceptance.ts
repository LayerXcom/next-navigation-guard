// Remembers that the user has accepted a guarded navigation which has not
// finished yet, so that beforeunload does not ask again when that navigation
// turns into a full page load.
//
// The record is cleared as soon as we know the navigation is over:
// - committed as an SPA navigation: history.pushState / replaceState
// - turned into a full page load: consumed on the first beforeunload
//   (even if the unload is cancelled, e.g. 204 response or download)
// - cancelled or failed (Pages Router): the router's Promise settles

type Acceptance = { href: string };

let current: Acceptance | null = null;

export type LeaveAcceptance = Acceptance;

export function markLeaveAccepted(): LeaveAcceptance {
  current = { href: location.href };
  return current;
}

// Without an argument, clears any record. With an argument, clears only if it
// is still the latest record, so that a settled older navigation does not
// clear the acceptance of a newer one.
export function clearLeaveAccepted(acceptance?: LeaveAcceptance): void {
  if (acceptance && current !== acceptance) return;
  current = null;
}

// For beforeunload. Returns true and clears the record when the user has
// already accepted leaving the current page.
export function consumeLeaveAccepted(currentHref: string): boolean {
  const accepted = current !== null && current.href === currentHref;
  current = null;
  return accepted;
}

// Pages Router returns a Promise that settles when the navigation is over
// (and never settles on a hard navigation). App Router returns void.
export function clearLeaveAcceptedOnSettle(
  acceptance: LeaveAcceptance,
  result: unknown
): void {
  if (!(result instanceof Promise)) return;
  result.then(
    () => clearLeaveAccepted(acceptance),
    () => clearLeaveAccepted(acceptance)
  );
}
