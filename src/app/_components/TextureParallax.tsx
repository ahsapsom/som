"use client";

import Image from "next/image";
import { useEffect } from "react";

const layers = [
  {
    src: "/textures/wood-layer-1.png",
    top: "-15%",
    left: "-10%",
    size: 1.4,
    speed: 0.04,
    opacity: 0.28,
  },
  {
    src: "/textures/wood-layer-2.png",
    top: "10%",
    right: "-20%",
    size: 1.2,
    speed: 0.06,
    opacity: 0.35,
  },
  {
    src: "/textures/wood-layer-3.png",
    bottom: "-20%",
    left: "5%",
    size: 1.3,
    speed: 0.025,
    opacity: 0.26,
  },
];

function setScrollVar(value: number) {
  document.documentElement.style.setProperty("--texture-scroll", `${value}px`);
}

export function TextureParallax() {
  useEffect(() => {
    const onScroll = () => setScrollVar(window.scrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-40 overflow-hidden"
      style={{ opacity: 0.85 }}
    >
      {layers.map((layer, index) => (
        <div
          key={`${layer.src}-${index}`}
          className="absolute"
          style={{
            top: layer.top,
            bottom: layer.bottom,
            left: layer.left,
            right: layer.right,
            transform: `translate3d(0, calc(var(--texture-scroll, 0px) * ${
              layer.speed
            }), 0) scale(${layer.size})`,
            opacity: layer.opacity,
          }}
        >
          <Image
            src={layer.src}
            alt=""
            width={1200}
            height={1200}
            className="max-h-[900px] w-auto"
            priority={index === 0}
            unoptimized
          />
        </div>
      ))}
    </div>
  );
}
