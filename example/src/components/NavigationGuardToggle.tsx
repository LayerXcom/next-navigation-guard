"use client";

import { useNavigationGuard } from "next-navigation-guard";
import React, { useState } from "react";

export function NavigationGuardToggle(props: { confirm: string }) {
  const [enabled, setEnabled] = useState(false);

  useNavigationGuard(() => (enabled ? window.confirm(props.confirm) : true));

  return (
    <label>
      <input
        type="checkbox"
        checked={enabled}
        onChange={() => setEnabled(!enabled)}
      />
      &nbsp; Enable Navigation Guard
    </label>
  );
}
