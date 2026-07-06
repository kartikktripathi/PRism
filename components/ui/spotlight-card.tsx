import React, { useRef } from "react";

interface SpotlightCardProps {
  children: React.ReactNode;
  spotlightColor?: string;
  className?: string;
}

export function SpotlightCard({
  children,
  spotlightColor = "rgba(255, 255, 255, 0.15)",
  className = "",
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() =>
        cardRef.current?.style.setProperty("--spotlight-opacity", "1")
      }
      onMouseLeave={() =>
        cardRef.current?.style.setProperty("--spotlight-opacity", "0")
      }
      className={`relative p-[1px] overflow-hidden transition-all duration-300 bg-zinc-900/60 spotlight-card-transition ${className}`}
      style={
        {
          backgroundImage: `radial-gradient(150px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), ${spotlightColor}4D, rgba(39, 39, 42, 0.3) 60%)`,
        } as React.CSSProperties
      }
    >
      {/* Background glow layer */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500 opacity-0"
        style={{
          opacity: "var(--spotlight-opacity, 0)",
          background: `radial-gradient(180px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), ${spotlightColor}0E, transparent 80%)`,
        }}
      />

      {/* Inner Content Box */}
      <div className="relative h-full w-full bg-black/95 p-5 z-10 flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
}
