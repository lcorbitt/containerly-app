"use client";

import { useContext } from "react";
import { NavigationProgressContext } from "./NavigationProgressProvider";

export function useNavigationProgress() {
  const value = useContext(NavigationProgressContext);
  if (value == null) {
    throw new Error("useNavigationProgress must be used within NavigationProgressProvider");
  }
  return value;
}
