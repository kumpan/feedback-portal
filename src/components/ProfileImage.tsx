"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface ProfileImageProps {
  src: string;
  alt: string;
}

export function ProfileImage({ src, alt }: ProfileImageProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 1.1, opacity: 0.5 }}
        animate={{
          scale: 1,
          opacity: 1,
          transition: {
            opacity: {
              ease: "easeInOut",
              duration: 0.2,
            },
            scale: {
              type: "spring",
              stiffness: 300,
              damping: 5,
            },
          },
        }}
      >
        <div className="h-12 w-12 overflow-hidden rounded-xl border">
          <Image
            src={src}
            alt={alt}
            width={80}
            height={80}
            className="h-full w-full object-cover"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
