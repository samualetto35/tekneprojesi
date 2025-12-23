"use client";

import { useEffect } from "react";

export default function ScrollToTopOnMount() {
  useEffect(() => {
    // Force the viewport to the very top when the page mounts
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  return null;
}

