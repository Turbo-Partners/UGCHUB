import { motion } from "framer-motion";

function OrbitingDiamond({ 
  radius, 
  duration, 
  delay = 0, 
  size = 10,
  reverse = false 
}: { 
  radius: number; 
  duration: number; 
  delay?: number;
  size?: number;
  reverse?: boolean;
}) {
  return (
    <motion.g
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "linear",
        delay,
      }}
      style={{ transformOrigin: "400px 400px" }}
    >
      <rect
        x={400 + radius - size/2}
        y={400 - size/2}
        width={size}
        height={size}
        fill="#6366F1"
        transform={`rotate(45, ${400 + radius}, 400)`}
        className="drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]"
      />
    </motion.g>
  );
}

export function GeometricBackground() {
  const orbits = [
    { radius: 380, duration: 25, diamonds: [0, 180] },
    { radius: 300, duration: 20, diamonds: [45, 135, 225, 315] },
    { radius: 220, duration: 15, diamonds: [90, 270] },
    { radius: 140, duration: 12, diamonds: [0, 120, 240] },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Subtle dot grid */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20 dark:opacity-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <circle cx="30" cy="30" r="0.5" fill="currentColor" className="text-foreground/30" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Main orbital system - hidden on mobile for performance */}
      <svg
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] hidden md:block"
        viewBox="0 0 800 800"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Concentric dotted circles */}
        {[380, 300, 220, 140, 80].map((r, i) => (
          <motion.circle
            key={r}
            cx="400"
            cy="400"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 8"
            className="text-primary/20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
          />
        ))}
        
        {/* Tilted elliptical orbits */}
        <motion.ellipse
          cx="400"
          cy="400"
          rx="350"
          ry="150"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 8"
          className="text-primary/15"
          transform="rotate(-25 400 400)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        />
        <motion.ellipse
          cx="400"
          cy="400"
          rx="320"
          ry="120"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 8"
          className="text-primary/15"
          transform="rotate(30 400 400)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        />
        
        {/* Orbiting diamonds on each circle */}
        {orbits.map((orbit, orbitIndex) => (
          orbit.diamonds.map((startAngle, diamondIndex) => (
            <motion.g
              key={`${orbitIndex}-${diamondIndex}`}
              animate={{ rotate: 360 }}
              transition={{
                duration: orbit.duration,
                repeat: Infinity,
                ease: "linear",
                delay: (startAngle / 360) * orbit.duration,
              }}
              style={{ transformOrigin: "400px 400px" }}
            >
              <motion.rect
                x={400 + orbit.radius - 6}
                y={400 - 6}
                width={12}
                height={12}
                fill="#6366F1"
                transform={`rotate(45, ${400 + orbit.radius}, 400)`}
                animate={{
                  opacity: [0.6, 1, 0.6],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: diamondIndex * 0.5,
                }}
                style={{
                  filter: "drop-shadow(0 0 8px rgba(99, 102, 241, 0.8))",
                }}
              />
            </motion.g>
          ))
        ))}
        
        {/* Center logo */}
        <defs>
          <clipPath id="circleClip">
            <circle cx="400" cy="400" r="35" />
          </clipPath>
        </defs>
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          <circle
            cx="400"
            cy="400"
            r="40"
            fill="none"
            stroke="#6366F1"
            strokeWidth="2"
            className="opacity-50"
          />
          <image
            href="/attached_assets/freepik__background__5578_1767050858710.png"
            x="365"
            y="365"
            width="70"
            height="70"
            clipPath="url(#circleClip)"
          />
        </motion.g>
      </svg>

      {/* Additional floating diamonds outside the orbit system */}
      {[
        { top: "10%", left: "5%", delay: 0 },
        { top: "20%", right: "8%", delay: 1 },
        { top: "50%", left: "3%", delay: 2 },
        { top: "75%", right: "5%", delay: 0.5 },
        { top: "85%", left: "15%", delay: 1.5 },
        { top: "30%", right: "3%", delay: 2.5 },
        { top: "65%", left: "8%", delay: 1.8 },
        { top: "90%", right: "20%", delay: 0.8 },
      ].map((pos, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 bg-primary rotate-45"
          style={{
            top: pos.top,
            left: pos.left,
            right: pos.right,
            boxShadow: "0 0 12px rgba(99, 102, 241, 0.6)",
          }}
          animate={{
            opacity: [0.4, 0.9, 0.4],
            scale: [1, 1.3, 1],
            y: [0, -10, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: pos.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Glowing orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/15 to-transparent blur-[120px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-violet-500/15 to-transparent blur-[100px]"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.35, 0.15],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
    </div>
  );
}
