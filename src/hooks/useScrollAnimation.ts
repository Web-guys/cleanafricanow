import { useEffect, useRef, useState, useLayoutEffect } from "react";

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useScrollAnimation = (options: UseScrollAnimationOptions = {}) => {
  const { threshold = 0.1, rootMargin = "100px", triggerOnce = true } = options;
  const ref = useRef<HTMLDivElement>(null);
  // Start with true to prevent flash of invisible content on initial load
  const [isVisible, setIsVisible] = useState(true);
  const hasCheckedInitial = useRef(false);

  // Use layout effect to check visibility before paint
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || hasCheckedInitial.current) return;
    
    hasCheckedInitial.current = true;
    
    // Check if element is in view on mount
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    
    // If element is in viewport or above it (already scrolled past), show it
    if (rect.top < windowHeight + 100 && rect.bottom > -100) {
      setIsVisible(true);
    } else {
      // Only hide if element is below viewport (not yet scrolled to)
      setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce && element) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isVisible };
};

// Staggered animation for lists
export const useStaggerAnimation = (itemCount: number, baseDelay: number = 100) => {
  const getDelay = (index: number) => `${index * baseDelay}ms`;
  return { getDelay };
};
