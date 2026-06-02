"use client";

import { useCallback, useEffect, useState } from "react";

import { REVEAL_IN_VIEW_THRESHOLD } from "./constants";

export function useRevealInView(options?: {
  threshold?: number;
  rootMargin?: string;
  /** When true, stay revealed after first intersection (typical for marketing sections). */
  triggerOnce?: boolean;
  enabled?: boolean;
}) {
  const threshold = options?.threshold ?? REVEAL_IN_VIEW_THRESHOLD;
  const rootMargin = options?.rootMargin ?? "0px";
  const triggerOnce = options?.triggerOnce ?? true;
  const enabled = options?.enabled ?? true;

  const [node, setNode] = useState<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  const ref = useCallback((el: HTMLElement | null) => {
    setNode(el);
  }, []);

  useEffect(() => {
    if (!enabled || !node) return;
    if (triggerOnce && inView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        if (entry.intersectionRatio < threshold) return;
        setInView(true);
        if (triggerOnce) observer.disconnect();
      },
      { rootMargin, threshold: [0, threshold] },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [node, inView, enabled, threshold, rootMargin, triggerOnce]);

  return { ref, inView: enabled ? inView : true };
}
