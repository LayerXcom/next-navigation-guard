import { GuardDef } from "../types";
import { debug } from "./debug";

export async function evaluateGuards(
  guardMap: Map<string, GuardDef>,
  type: "push" | "replace" | "refresh",
  to: string,
  accepted: () => boolean | Promise<boolean>
): Promise<boolean> {
  debug(`Navigation attempt: ${type} to ${to}`);
  const defs = [...guardMap.values()];
  for (const { enabled, callback } of defs) {
    if (!enabled({ to, type })) continue;

    debug(`Calling guard callback for ${type} to ${to}`);
    const confirm = await callback({ to, type });
    debug(`Guard callback returned: ${confirm}`);
    if (!confirm) {
      debug(`Navigation blocked`);
      return false;
    }
  }
  debug(`All guards passed, proceeding with navigation`);
  return await accepted();
}
