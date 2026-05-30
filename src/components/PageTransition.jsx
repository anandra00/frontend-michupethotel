import { motion, useReducedMotion } from 'framer-motion';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 0.98
  }
};

const reducedVariants = {
  initial: { opacity: 0 },
  in: { opacity: 1 },
  out: { opacity: 0 }
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.2 // Faster duration for snappier UX
};

const PageTransition = ({ children }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={shouldReduceMotion ? reducedVariants : pageVariants}
      transition={pageTransition}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
