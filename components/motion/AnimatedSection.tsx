"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { EASE_LUX } from "@/lib/motion";

const fadeUp = {
  hidden: { opacity: 0, y: 44 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.82, ease: EASE_LUX },
  },
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
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-12% 0px -8% 0px" }}
      variants={fadeUp}
      className={className}
      {...props}
    >
      {children}
    </motion.section>
  );
}
