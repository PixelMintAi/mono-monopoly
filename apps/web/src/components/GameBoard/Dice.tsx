import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

interface DiceProps {
  value: number;
  isRolling: boolean;
}

const Dice: React.FC<DiceProps> = ({ value, isRolling }) => {
  const renderDots = () => {
    const dotClass = "w-2.5 h-2.5 bg-primary rounded-full shadow-sm";
    
    switch (value) {
      case 1:
        return (
          <div className="grid place-items-center h-full w-full">
            <div className={cn(dotClass, "bg-primary")} />
          </div>
        );
      case 2:
        return (
          <div className="grid grid-cols-2 gap-6 p-3 h-full w-full">
            <div className={cn(dotClass, "justify-self-start self-start")} />
            <div className={cn(dotClass, "justify-self-end self-end")} />
          </div>
        );
      case 3:
        return (
          <div className="grid grid-cols-3 gap-2 p-2 h-full w-full">
            <div className={cn(dotClass, "justify-self-start self-start")} />
            <div className={cn(dotClass, "col-start-2 row-start-2 justify-self-center self-center")} />
            <div className={cn(dotClass, "col-start-3 row-start-3 justify-self-end self-end")} />
          </div>
        );
      case 4:
        return (
          <div className="grid grid-cols-2 gap-6 p-3 h-full w-full">
            <div className={cn(dotClass, "justify-self-start self-start")} />
            <div className={cn(dotClass, "justify-self-end self-start")} />
            <div className={cn(dotClass, "justify-self-start self-end")} />
            <div className={cn(dotClass, "justify-self-end self-end")} />
          </div>
        );
      case 5:
        return (
          <div className="grid grid-cols-3 gap-2 p-2 h-full w-full">
            <div className={cn(dotClass, "justify-self-start self-start")} />
            <div className={cn(dotClass, "col-start-3 justify-self-end self-start")} />
            <div className={cn(dotClass, "col-start-2 row-start-2 justify-self-center self-center")} />
            <div className={cn(dotClass, "row-start-3 justify-self-start self-end")} />
            <div className={cn(dotClass, "col-start-3 row-start-3 justify-self-end self-end")} />
          </div>
        );
      case 6:
        return (
          <div className="grid grid-cols-2 gap-6 p-3 h-full w-full">
            <div className={cn(dotClass, "justify-self-start self-start")} />
            <div className={cn(dotClass, "justify-self-end self-start")} />
            <div className={cn(dotClass, "justify-self-start self-center")} />
            <div className={cn(dotClass, "justify-self-end self-center")} />
            <div className={cn(dotClass, "justify-self-start self-end")} />
            <div className={cn(dotClass, "justify-self-end self-end")} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="relative w-16 h-16 bg-card rounded-xl shadow-lg border border-border/50"
      animate={isRolling ? {
        rotateX: [0, 360, 720, 1080],
        rotateY: [0, 360, 720, 1080],
        scale: [1, 1.1, 1],
      } : {}}
      transition={{ 
        duration: 0.8,
        repeat: isRolling ? Infinity : 0,
        ease: "easeInOut"
      }}
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
    >
      {/* Dice face */}
      <div className="absolute inset-0 bg-gradient-to-br from-card to-card/80 rounded-xl overflow-hidden">
        {renderDots()}
      </div>
      
      {/* Dice shadow */}
      <motion.div
        className="absolute inset-0 bg-black/20 rounded-xl"
        animate={isRolling ? {
          opacity: [0.2, 0.4, 0.2],
          scale: [1, 1.2, 1],
        } : {}}
        transition={{ 
          duration: 0.8,
          repeat: isRolling ? Infinity : 0,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
};

export default Dice;