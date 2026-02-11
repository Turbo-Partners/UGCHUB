import { motion } from "framer-motion";

const platforms = [
  { name: "Instagram", icon: "https://cdn.simpleicons.org/instagram/E4405F", angle: 0 },
  { name: "TikTok", icon: "https://cdn.simpleicons.org/tiktok/000000", angle: 72, invert: true },
  { name: "YouTube", icon: "https://cdn.simpleicons.org/youtube/FF0000", angle: 144 },
  { name: "Shopify", icon: "https://cdn.simpleicons.org/shopify/7AB55C", angle: 216 },
  { name: "Loja Integrada", icon: "/attached_assets/novo-logo-loja-integrada-2021_1_1767108713445.png", angle: 288 },
];

const innerPlatforms = [
  { name: "Meta", icon: "https://cdn.simpleicons.org/meta/0081FB", angle: 0 },
  { name: "VTEX", icon: "https://cdn.simpleicons.org/vtex/F71963", angle: 180 },
];

export function OrbitAnimation() {
  return (
    <div className="relative w-full aspect-square max-w-[380px] mx-auto mt-4 flex items-center justify-center">
      <motion.div
        className="absolute inset-0 rounded-full border border-dashed border-primary/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />
      <motion.div 
        className="absolute inset-[15%] rounded-full border border-dashed border-primary/30" 
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      />
      <motion.div 
        className="absolute inset-[30%] rounded-full border border-dashed border-primary/40"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      
      <div
        className="absolute inset-[40%] rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/40 shadow-lg z-10"
        style={{
          boxShadow: "0 0 30px rgba(99, 102, 241, 0.3)",
        }}
      >
        <img 
          src="/attached_assets/freepik__background__5578_1767050858710.png" 
          alt="CreatorConnect" 
          className="w-10 h-10 rounded-full object-cover"
        />
      </div>

      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {platforms.map((platform) => {
          const radius = 42;
          const angleInRadians = (platform.angle * Math.PI) / 180;
          const x = 50 + radius * Math.cos(angleInRadians);
          const y = 50 + radius * Math.sin(angleInRadians);
          
          return (
            <motion.div
              key={platform.name}
              className="absolute w-10 h-10 -ml-5 -mt-5 rounded-xl bg-card border border-border flex items-center justify-center shadow-lg"
              style={{ 
                left: `${x}%`, 
                top: `${y}%`,
              }}
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              whileHover={{ scale: 1.2 }}
            >
              <img 
                src={platform.icon} 
                alt={platform.name} 
                className={`w-5 h-5 object-contain ${platform.invert ? "dark:invert" : ""}`}
              />
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        className="absolute inset-[15%]"
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        {innerPlatforms.map((platform) => {
          const radius = 50;
          const angleInRadians = (platform.angle * Math.PI) / 180;
          const x = 50 + radius * Math.cos(angleInRadians);
          const y = 50 + radius * Math.sin(angleInRadians);
          
          return (
            <motion.div
              key={platform.name}
              className="absolute w-9 h-9 -ml-4.5 -mt-4.5 rounded-xl bg-card border border-border flex items-center justify-center shadow-lg"
              style={{ 
                left: `${x}%`, 
                top: `${y}%`,
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              whileHover={{ scale: 1.2 }}
            >
              <img 
                src={platform.icon} 
                alt={platform.name} 
                className="w-5 h-5 object-contain"
              />
            </motion.div>
          );
        })}
      </motion.div>

      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={`diamond-${i}`}
          className="absolute w-2 h-2 bg-primary rotate-45"
          style={{
            left: `${20 + i * 20}%`,
            top: `${10 + (i % 2) * 80}%`,
          }}
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  );
}
