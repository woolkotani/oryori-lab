"use client";

import { useEffect, useRef } from "react";

export default function BadgeAwarder() {
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    fetch("/api/badges", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.awarded?.length > 0) {
          // Reload to show new badges
          window.location.reload();
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
