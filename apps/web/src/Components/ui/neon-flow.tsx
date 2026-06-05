import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const randomColors = (count: number) => {
  return new Array(count)
    .fill(0)
    .map(() => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"));
};

export interface TubesBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  enableClickInteraction?: boolean;
}

export function TubesBackground({
  children,
  className,
  enableClickInteraction = true,
}: TubesBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tubesRef = useRef<{ tubes?: { setColors: (c: string[]) => void; setLightsColors: (c: string[]) => void } } | null>(null);

  useEffect(() => {
    let mounted = true;
    let observer: ResizeObserver | null = null;
    let initialized = false;

    const initTubes = async () => {
      if (!canvasRef.current) return;

      try {
        const module = await import(
          /* @vite-ignore */
          "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js"
        );
        const TubesCursor = module.default;

        if (!mounted || !canvasRef.current) return;

        const app = TubesCursor(canvasRef.current, {
          tubes: {
            colors: ["#f967fb", "#53bc28", "#6958d5"],
            lights: {
              intensity: 200,
              colors: ["#83f36e", "#fe8a2e", "#ff008a", "#60aed5"],
            },
          },
        });

        tubesRef.current = app;
        initialized = true;
      } catch (error) {
        console.warn("TubesBackground: could not load tubes cursor lib", error);
      }
    };

    const checkAndInit = () => {
      if (!canvasRef.current || initialized) return;
      const width = canvasRef.current.clientWidth || canvasRef.current.offsetWidth || 0;
      const height = canvasRef.current.clientHeight || canvasRef.current.offsetHeight || 0;
      if (width > 0 && height > 0) {
        initTubes();
        if (observer) {
          observer.disconnect();
          observer = null;
        }
      }
    };

    if (typeof window !== "undefined" && typeof ResizeObserver !== "undefined" && canvasRef.current) {
      observer = new ResizeObserver(() => {
        checkAndInit();
      });
      observer.observe(canvasRef.current);
    }

    // Run an initial check in case size is already non-zero
    checkAndInit();

    return () => {
      mounted = false;
      tubesRef.current = null;
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  const handleClick = () => {
    if (!enableClickInteraction || !tubesRef.current?.tubes) return;
    const colors = randomColors(3);
    const lightsColors = randomColors(4);
    tubesRef.current.tubes.setColors(colors);
    tubesRef.current.tubes.setLightsColors(lightsColors);
  };

  return (
    <div
      className={cn("relative w-full h-full min-h-[400px] overflow-hidden bg-background", className)}
      onClick={handleClick}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{ touchAction: "none" }}
      />
      <div className="relative z-10 w-full h-full pointer-events-none">{children}</div>
    </div>
  );
}

export default TubesBackground;
