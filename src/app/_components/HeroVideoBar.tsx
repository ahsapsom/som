"use client";

type HeroVideoBarProps = {
  video?: { url: string; title?: string; description?: string };
};

export function HeroVideoBar(props: HeroVideoBarProps) {
  if (!props.video?.url) return null;

  return (
    <div className="absolute inset-x-0 top-12 z-40 flex justify-center">
      <div className="pointer-events-none overflow-hidden rounded-3xl border border-border/50 bg-white/90 shadow-2xl shadow-black/10">
        <iframe
          title={props.video.title ?? "Tanıtım videosu"}
          src={props.video.url}
          className="h-40 w-[320px] min-w-[280px] md:h-60 md:w-[520px]"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
