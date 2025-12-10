import { buildPreviewSrc } from "@/utils";
import type { Camera } from "@/types";

interface CameraSelectorProps {
  cameras: Camera[];
  activeIndex: number;
  onSelectCamera: (index: number) => void;
}

export const CameraSelector = ({ cameras, activeIndex, onSelectCamera }: CameraSelectorProps) => {
  return (
    <section className="w-full lg:w-96 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
      <h3 className="mb-6 text-center text-sm font-semibold uppercase tracking-[0.3em] text-white/70">Seleção de Câmeras</h3>

      {/* Tatame Visual */}
      <div className="relative mx-auto aspect-square w-full max-w-[400px] mb-6">
        <div className="absolute inset-[15%] rounded-2xl border-4 border-dashed border-emerald-500/30 bg-linear-to-br from-emerald-950/20 to-emerald-900/10 shadow-inner">
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <div className="text-4xl font-bold text-emerald-400/40">畳</div>
              <p className="mt-2 text-xs uppercase tracking-widest text-white/30">Tatame</p>
            </div>
          </div>
        </div>

        {/* Camera Position Buttons */}
        {cameras.map((camera, index) => {
          const angle = (index / cameras.length) * 360;
          const radians = ((angle - 90) * Math.PI) / 180;
          const x = 50 + Math.cos(radians) * 42;
          const y = 50 + Math.sin(radians) * 42;
          const isActive = index === activeIndex;

          return (
            <button
              key={camera.name}
              type="button"
              onClick={() => onSelectCamera(index)}
              className={`absolute flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 font-bold transition-all duration-300 ${isActive
                  ? "border-emerald-400 bg-emerald-500 text-white shadow-lg shadow-emerald-500/50 scale-110"
                  : "border-white/30 bg-slate-800/80 text-white/70 hover:border-white hover:bg-slate-700 hover:scale-105"
                }`}
              style={{
                top: `${y}%`,
                left: `${x}%`,
              }}
              aria-pressed={isActive}
              aria-label={`Selecionar ${camera.name}`}
            >
              <div className="text-center">
                <div className="text-lg leading-none">{index + 1}</div>
                {isActive && (
                  <div className="text-[8px] leading-none opacity-80">ATIVA</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Camera List */}
      <div className="mt-6 space-y-2">
        {cameras.map((camera, index) => (
          <button
            key={`label-${camera.name}`}
            onClick={() => onSelectCamera(index)}
            className={`w-full rounded-lg px-4 py-2 text-left text-sm transition-all ${index === activeIndex
                ? "bg-emerald-500/20 font-semibold text-emerald-200 border border-emerald-400/50"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-transparent"
              }`}
          >
            <span className="font-mono text-xs opacity-60">{index + 1}</span> {camera.name}
          </button>
        ))}
      </div>
    </section>
  );
};
