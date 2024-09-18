"use client";

import { useNavigationGuard } from "next-navigation-guard";
import React, { useState } from "react";

export function NavigationGuardToggle(props: { confirm: string }) {
  const [enabled, setEnabled] = useState(false);
  const [isAsync, setIsAsync] = useState(false);

  const navGuard = useNavigationGuard({
    enabled,
    confirm: isAsync ? undefined : () => window.confirm(props.confirm),
  });

  return (
    <div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          &nbsp; Enable Navigation Guard
        </label>
      </div>

      <div style={{ marginTop: 8 }}>
        <label>
          <input
            type="checkbox"
            checked={isAsync}
            onChange={(e) => setIsAsync(e.target.checked)}
          />
          &nbsp; Use Async Confirm
        </label>
      </div>

      {navGuard.active && (
        <div style={{ border: 1, margin: "8px 0" }}>
          <div>{props.confirm}</div>

          <button onClick={navGuard.accept}>OK</button>
          <button style={{ marginLeft: 8 }} onClick={navGuard.reject}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
