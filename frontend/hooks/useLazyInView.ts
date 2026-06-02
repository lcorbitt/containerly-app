"use client";

import { useCallback, useEffect, useState } from "react";

/** Observe once when near viewport — used to defer signed URL / preview work. */
export function useLazyInView(options?: { rootMargin?: string; threshold?: number }) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  const ref = useCallback((el: HTMLElement | null) => {
    setNode(el);
  }, []);

  useEffect(() => {
    if (!node || inView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: options?.rootMargin ?? "280px",
        threshold: options?.threshold ?? 0.01,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [node, inView, options?.rootMargin, options?.threshold]);

  return { ref, inView };
}
