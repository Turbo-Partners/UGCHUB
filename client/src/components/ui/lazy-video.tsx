import { useState, useRef, useEffect, useCallback } from "react";

interface LazyVideoProps {
  src: string;
  className?: string;
  poster?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
}

export function LazyVideo({ 
  src, 
  className = "", 
  poster,
  autoPlay = true,
  loop = true,
  muted = true,
  playsInline = true
}: LazyVideoProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          const vid = videoRef.current;
          if (vid && vid.paused && vid.readyState >= 2) {
            vid.play().catch(() => {});
          }
        } else {
          const vid = videoRef.current;
          if (vid && !vid.paused) {
            vid.pause();
          }
        }
      },
      {
        rootMargin: "50px",
        threshold: 0.01,
      }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      const vid = videoRef.current;
      if (vid) {
        vid.pause();
        vid.removeAttribute('src');
        vid.load();
      }
    };
  }, []);

  const handleLoadedData = useCallback(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse rounded-inherit" />
      )}
      {shouldLoad && (
        <video
          ref={videoRef}
          src={src}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          poster={poster}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          playsInline={playsInline}
          preload="none"
          onLoadedData={handleLoadedData}
        />
      )}
    </div>
  );
}
