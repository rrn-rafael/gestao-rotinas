export function RoutineCanvasBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),rgba(244,247,251,0.72)_42%,rgba(233,239,246,0.86))]" />
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.1) 1px, transparent 1px)",
          backgroundPosition: "0 0, 0 0",
          backgroundSize: "40px 40px",
          maskImage:
            "radial-gradient(circle at center, black 48%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, black 48%, transparent 100%)",
        }}
      />
    </>
  );
}
