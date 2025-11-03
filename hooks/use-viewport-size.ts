"use client";

import { useState, useEffect } from "react";

export type ViewportSize = "mobile" | "tablet" | "desktop";

export function useViewportSize(): ViewportSize {
  const [viewportSize, setViewportSize] = useState<ViewportSize>("desktop");

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      if (width < 768) {
        setViewportSize("mobile");
      } else if (width < 1024) {
        setViewportSize("tablet");
      } else {
        setViewportSize("desktop");
      }
    };

    // Initial call
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return viewportSize;
}
