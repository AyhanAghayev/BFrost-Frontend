"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/stores/theme.store";

export default function ThemeInit() {
  const init = useThemeStore((s) => s.init);
  useEffect(() => {
    init();
  }, [init]);
  return null;
}