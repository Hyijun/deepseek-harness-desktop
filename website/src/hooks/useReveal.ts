import { useEffect, useRef } from "react";

/**
 * Adds `is-visible` to any element under the container as it scrolls into view.
 * Elements should carry the `reveal` class (defined in main.css).
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) {
      return;
    }
    const targets = root.classList.contains("reveal") ? [root] : Array.from(root.querySelectorAll(".reveal"));
    if (targets.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return ref;
}
