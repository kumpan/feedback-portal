"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { m, AnimatePresence } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
      duration: 0.3,
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      opacity: {
        ease: "easeInOut",
        duration: 0.2,
      },
      y: {
        type: "spring",
        damping: 25,
        stiffness: 300,
      },
    },
  },
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  actions,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);

      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={handleBackdropClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <m.div
            ref={modalRef}
            className={cn(
              "w-full max-w-lg rounded-2xl bg-background",
              className
            )}
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <m.div
              className="flex items-center justify-between border-b pl-4 pr-2 md:pl-6 md:pr-3 py-2 md:py-3"
              variants={childVariants}
            >
              <h3 className="text-xl md:text-2xl">{title}</h3>
              <div className="flex items-center gap-2">
                {actions}
                <button
                  onClick={onClose}
                  className="rounded-lg p-4 hover:bg-primary-85 cursor-pointer transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </m.div>
            <m.div
              className="p-4 md:p-6 max-h-[72vh] overflow-y-auto"
              variants={childVariants}
            >
              {children}
            </m.div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
