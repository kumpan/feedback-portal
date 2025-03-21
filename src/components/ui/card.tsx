import * as React from "react";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const springTransition = {
  type: "spring",
  stiffness: 100,
  damping: 12,
};

const easeTransition = {
  ease: "easeInOut",
  duration: 0.2,
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 1 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      opacity: easeTransition,
      y: springTransition,
      scale: springTransition,
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.95,
    transition: {
      opacity: easeTransition,
      y: springTransition,
      scale: springTransition,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0.5, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      opacity: easeTransition,
      y: springTransition,
    },
  },
};

type MotionDivProps = HTMLMotionProps<"div">;

function Card({ className, ...props }: MotionDivProps) {
  return (
    <motion.div
      data-slot="card"
      className={cn("bg-card flex flex-col gap-1 rounded-xl py-6", className)}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: MotionDivProps) {
  return (
    <motion.div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-[data-slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      variants={itemVariants}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: MotionDivProps) {
  return (
    <motion.div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      variants={itemVariants}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: MotionDivProps) {
  return (
    <motion.div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      variants={itemVariants}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: MotionDivProps) {
  return (
    <motion.div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      variants={itemVariants}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: MotionDivProps) {
  return (
    <motion.div
      data-slot="card-content"
      className={cn("px-6", className)}
      variants={itemVariants}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: MotionDivProps) {
  return (
    <motion.div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      variants={itemVariants}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
