import React, { useState, useEffect, useRef } from "react";
export const DeferredView: React.FC<{
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  rootMargin?: string;
  minHeight?: string;
  className?: string;
}> = ({
  children,
  placeholder,
  rootMargin = "500px",
  minHeight = "300px",
  className = "w-full h-full",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isVisible) return;
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [isVisible, rootMargin]);
  return (
    <div
      ref={containerRef}
      style={!isVisible ? { minHeight } : undefined}
      className={className}
    >
      {isVisible ? children : placeholder}
    </div>
  );
};
