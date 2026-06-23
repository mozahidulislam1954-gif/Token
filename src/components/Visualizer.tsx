import { motion } from "framer-motion";
import { useMemo } from "react";
import { PERSONA_CONFIGS } from "../services/liveService";

type VisualizerState = "idle" | "listening" | "processing" | "speaking";

interface VisualizerProps {
  state: VisualizerState;
  activePersona: string;
}

export default function Visualizer({ state, activePersona }: VisualizerProps) {
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

  // Modern tech-focused color palette, adjusted with rich contrast for Neumorphic light-ambient surfaces
  const getTheme = () => {
    switch (state) {
      case "listening": return { color: "rgba(124, 58, 237, 1)", glow: "shadow-violet-400/40", border: "border-violet-300", fill: "bg-violet-600", text: "text-violet-700" };
      case "processing": return { color: "rgba(2, 132, 199, 1)", glow: "shadow-sky-400/40", border: "border-sky-300", fill: "bg-sky-600", text: "text-sky-700" };
      case "speaking": return { color: "rgba(219, 39, 119, 1)", glow: "shadow-pink-400/40", border: "border-pink-300", fill: "bg-pink-600", text: "text-pink-700" };
      default: return { color: "rgba(13, 148, 136, 1)", glow: "shadow-teal-400/30", border: "border-teal-300", fill: "bg-teal-600", text: "text-teal-700" };
    }
  };

  const theme = getTheme();

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
      {/* Ambient Glow background */}
      <motion.div
        animate={getPulseAnimation()}
        className={`absolute w-[60dvw] h-[60dvw] max-w-[600px] max-h-[600px] rounded-full blur-[90px] ${theme.glow}`}
        style={{ backgroundColor: theme.color, opacity: 0.08 }}
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
                  className={`w-[60px] h-[16px] rounded-full border border-t-[2px] ${theme.border} opacity-40`}
                  style={{
                    transform: `translateX(120px) rotate(${35}deg)`,
                    boxShadow: `0 0 10px ${theme.color}33`,
                  }}
                />
                <div 
                  className={`w-[40px] h-[10px] rounded-full border border-b-[2px] ${theme.border} opacity-30`}
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
          className={`absolute w-[280px] h-[280px] rounded-full border border-dashed ${theme.border} opacity-35`}
        />

        <motion.div
          animate={getRingAnimation(1, false)}
          className={`absolute w-[210px] h-[210px] rounded-full border border-dotted ${theme.border} opacity-50`}
        />
      </div>

      {/* Main Core Circle - display the current state / assistant label as an extruded neumorphic dial */}
      <motion.div
        animate={getPulseAnimation()}
        className="absolute w-[160px] h-[160px] rounded-full flex flex-col items-center justify-center transition-all duration-300 pointer-events-auto"
        style={{
          backgroundColor: '#e0e5ec',
          boxShadow: state !== "idle"
            ? `inset 5px 5px 10px rgba(163, 177, 198, 0.8), inset -5px -5px 10px rgba(255, 255, 255, 0.9), 0 0 35px ${theme.color}33`
            : `8px 8px 16px rgba(163, 177, 198, 0.65), -8px -8px 16px rgba(255, 255, 255, 0.95)`
        }}
      >
        <div 
          className="font-bold tracking-[0.25em] text-lg select-none whitespace-nowrap text-center text-ellipsis max-w-full overflow-hidden px-2 transition-colors duration-300"
          style={{ 
            color: state === "idle" ? '#4a5568' : '#1a202c',
            textShadow: state !== "idle" ? `0 0 12px ${theme.color}44` : 'none',
            fontSize: 'clamp(10px, 1.15rem, 16px)' 
          }}
        >
          {PERSONA_CONFIGS[activePersona]?.label?.toUpperCase() || 'TOKEN'}
        </div>
        
        {/* Under-center status mini text */}
        <span className={`text-[9px] tracking-[0.15em] font-mono font-bold mt-1.5 uppercase transition-colors duration-300`} style={{ color: theme.color }}>
          {state}
        </span>
      </motion.div>
    </div>
  );
}
