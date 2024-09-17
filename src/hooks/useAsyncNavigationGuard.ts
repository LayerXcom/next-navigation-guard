import { useState } from "react";
import { useNavigationGuard } from "./useNavigationGuard";
import { NavigationGuard } from "../types";

export function useAsyncNavigationGuard() {
  const [state, setState] = useState<NavigationGuard | null>(null);
  useNavigationGuard((params) => params.accept());
  useNavigationGuard((params) => params.reject());
}
