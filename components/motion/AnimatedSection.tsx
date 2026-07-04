"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { EASE_LUX, reducedMotionTransition } from "@/lib/motion";

const fadeUp = {
  hidden: { opacity: 0, y: 44 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.82, ease: EASE_LUX },
  },
};

const fadeUpReduced = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0, transition: reducedMotionTransition },
};

type AnimatedSectionProps = HTMLMotionProps<"section"> & {
  children: React.ReactNode;
  className?: string;
};

export function AnimatedSection({
  children,
  className,
  ...props
}: AnimatedSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-12% 0px -8% 0px" }}
      variants={prefersReducedMotion ? fadeUpReduced : fadeUp}
      className={className}
      {...props}
    >
      {children}
    </motion.section>
  );
}
