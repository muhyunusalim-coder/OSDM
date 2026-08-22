import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
export const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const findContainer = () =>
      document.querySelector(".overflow-y-auto") || window;
    const toggleVisibility = () => {
      const container = findContainer();
      const scrollTop =
        container === window
          ? window.scrollY
          : (container as HTMLElement).scrollTop;
      if (scrollTop > 250) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    const container = findContainer();
    container.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => container.removeEventListener("scroll", toggleVisibility);
  }, []);
  const scrollToTop = () => {
    const container = document.querySelector(".overflow-y-auto") || window;
    if (container === window) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      (container as HTMLElement).scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 p-2.5 sm:p-3 rounded-full bg-primary-600 text-white shadow-xl hover:bg-primary-700 hover:shadow-primary-600/30 transition-all active:scale-95 border border-primary-500 cursor-pointer"
          title="Ke Atas"
          aria-label="Kembali ke atas"
        >
          <ArrowUp size={18} className="sm:w-5 sm:h-5" strokeWidth={2.5} />
        </button>
      )}
    </>
  );
};
