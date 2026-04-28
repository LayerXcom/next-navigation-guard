import { MutableRefObject } from "react";
import { GuardDef, NavigationGuardParams } from "../types";
import { debug } from "./debug";

export async function evaluateGuards(
  guardMapRef: MutableRefObject<Map<string, GuardDef>>,
  params: NavigationGuardParams
): Promise<boolean> {
  debug(`Navigation attempt: ${params.type} to ${params.to}`);

  for (const { enabled, callback } of guardMapRef.current.values()) {
    if (!enabled(params)) continue;

    debug(`Calling guard callback`);
    const confirm = await callback(params);
    debug(`Guard callback returned: ${confirm}`);
    if (!confirm) {
      debug(`Navigation blocked`);
      return false;
    }
  }

  debug(`All guards passed`);
  return true;
}
