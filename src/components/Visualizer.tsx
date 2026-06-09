import { motion } from "motion/react";

type VisualizerState = "idle" | "listening" | "processing" | "speaking";

interface VisualizerProps {
  state: VisualizerState;
}

export default function Visualizer({ state }: VisualizerProps) {
  const getRingAnimation = (index: number, reverse: boolean = false) => {
    const baseSpeed = state === "listening" ? 3 : state === "processing" ? 1.5 : state === "speaking" ? 2 : 15;
    return {
      rotate: reverse ? [-360, 0] : [0, 360],
      transition: { duration: baseSpeed + index * 2, repeat: Infinity, ease: "linear" }
    };
  };

  const getPulseAnimation = () => {
    if (state === "speaking") {
      return {
        scale: [1, 1.05, 0.98, 1.02, 1],
        opacity: [0.8, 1, 0.8, 1, 0.8],
        transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
      };
    }
    if (state === "listening") {
      return {
        scale: [1, 1.02, 1],
        opacity: [0.7, 1, 0.7],
        transition: { duration: 1, repeat: Infinity, ease: "easeInOut" }
      };
    }
    if (state === "processing") {
      return {
        scale: [0.98, 1.02, 0.98],
        opacity: [0.6, 0.9, 0.6],
        transition: { duration: 0.8, repeat: Infinity, ease: "linear" }
      };
    }
    return {
      scale: [1, 1.01, 1],
      opacity: [0.4, 0.6, 0.4],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    };
  };

  // Modern tech-focused color palette
  const getTheme = () => {
    switch (state) {
      case "listening": return { color: "rgba(139, 92, 246, 1)", glow: "shadow-violet-500/60", border: "border-violet-400", fill: "bg-violet-500", text: "text-violet-300" };
      case "processing": return { color: "rgba(56, 189, 248, 1)", glow: "shadow-sky-400/80", border: "border-sky-400", fill: "bg-sky-400", text: "text-sky-300" };
      case "speaking": return { color: "rgba(236, 72, 153, 1)", glow: "shadow-pink-500/80", border: "border-pink-400", fill: "bg-pink-500", text: "text-pink-300" };
      default: return { color: "rgba(6, 182, 212, 0.8)", glow: "shadow-cyan-500/40", border: "border-cyan-500/50", fill: "bg-cyan-500", text: "text-cyan-300" };
    }
  };

  const theme = getTheme();

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
      {/* Ambient Glow background */}
      <motion.div
        animate={getPulseAnimation()}
        className={`absolute w-[60dvw] h-[60dvw] max-w-[600px] max-h-[600px] rounded-full blur-[90px] ${theme.glow}`}
        style={{ backgroundColor: theme.color, opacity: 0.12 }}
      />

      {/* Vortex Portal Swirl Arms */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute w-[420px] h-[420px] flex items-center justify-center">
          {Array.from({ length: 16 }).map((_, i) => {
            const baseRotation = i * (360 / 16);
            const rotationSpeed = state === "listening" ? 4 : state === "processing" ? 2 : state === "speaking" ? 3 : 20;
            return (
              <motion.div
                key={i}
                animate={{
                  rotate: [baseRotation, baseRotation + 360],
                  scale: state === "speaking" ? [1, 1.1, 0.95, 1.05, 1] : [1, 1.02, 1],
                }}
                transition={{
                  rotate: { duration: rotationSpeed, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                }}
                className="absolute"
              >
                {/* Glowing spiral nodes */}
                <div 
                  className={`w-[60px] h-[16px] rounded-full border border-t-[2px] ${theme.border} opacity-30`}
                  style={{
                    transform: `translateX(120px) rotate(${35}deg)`,
                    boxShadow: `0 0 10px ${theme.color}`,
                  }}
                />
                <div 
                  className={`w-[40px] h-[10px] rounded-full border border-b-[2px] ${theme.border} opacity-20`}
                  style={{
                    transform: `translateX(160px) rotate(${-25}deg)`,
                  }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Infinite spinning vortex center layers */}
        <motion.div
          animate={getRingAnimation(3, true)}
          className={`absolute w-[280px] h-[280px] rounded-full border border-dashed ${theme.border} opacity-25`}
        />

        <motion.div
          animate={getRingAnimation(1, false)}
          className={`absolute w-[210px] h-[210px] rounded-full border border-dotted ${theme.border} opacity-40`}
        />
      </div>

      {/* Main Core Circle - display the current state / assistant label */}
      <motion.div
        animate={getPulseAnimation()}
        className={`absolute w-[150px] h-[150px] rounded-full border-[1.5px] ${theme.border} bg-black/60 backdrop-blur-md flex flex-col items-center justify-center shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]`}
        style={{ boxShadow: `0 0 45px ${theme.color}, inset 0 0 35px ${theme.color}` }}
      >
        <div 
          className="font-bold tracking-[0.3em] text-xl text-white select-none"
          style={{ textShadow: `0 0 15px ${theme.color}, 0 0 30px ${theme.color}` }}
        >
          TOKEN
        </div>
        
        {/* Under-center status mini text */}
        <span className={`text-[8px] tracking-[0.15em] font-mono mt-1 ${theme.text} opacity-80 uppercase`}>
          {state}
        </span>
      </motion.div>
    </div>
  );
}
