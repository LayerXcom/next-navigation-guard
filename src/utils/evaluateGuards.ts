import { MutableRefObject } from "react";
import {
  GuardDef,
  NavigationGuardCallback,
  NavigationGuardParams,
} from "../types";
import { debug } from "./debug";

export async function evaluateGuards(
  guardMapRef: MutableRefObject<Map<string, GuardDef>>,
  mockConfirmRef: MutableRefObject<NavigationGuardCallback | undefined>,
  params: NavigationGuardParams
): Promise<boolean> {
  debug(`Navigation attempt: ${params.type} to ${params.to}`);

  const mockConfirm = mockConfirmRef.current;

  for (const { enabled, callback } of guardMapRef.current.values()) {
    if (!enabled(params)) continue;

    const confirmFn = mockConfirm ?? callback;
    if (mockConfirm) {
      debug(`Calling mockConfirm for ${params.type} to ${params.to}`);
    } else {
      debug(`Calling guard callback for ${params.type} to ${params.to}`);
    }
    const confirm = await confirmFn(params);
    debug(`Guard callback returned: ${confirm}`);
    if (!confirm) {
      debug(`Navigation blocked`);
      return false;
    }
  }

  debug(`All guards passed, proceeding with navigation`);
  return true;
}
