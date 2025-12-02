"use client";

import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type Hls from "hls.js";

const cameraFiles = [
  { label: "Câmera 1 · Teto", filename: "Cam1 (teto).mp4" },
  { label: "Câmera 2", filename: "Cam2.mp4" },
  { label: "Câmera 3", filename: "Cam3.mp4" },
  { label: "Câmera 4", filename: "Cam4.mp4" },
  { label: "Câmera 5", filename: "Cam5.mp4" },
  { label: "Câmera 6", filename: "Cam6.mp4" },
  { label: "Câmera 7", filename: "Cam7.mp4" },
  { label: "Câmera 8", filename: "Cam8.mp4" },
];

const PREVIEW_VARIANT = "480p";

const buildVideoSrc = (filename: string) =>
  `/available_cameras/${encodeURIComponent(filename)}`;

const buildPreviewSrc = (filename: string) => {
  const dotIndex = filename.lastIndexOf(".");
  const previewName =
    dotIndex === -1
      ? `${filename}.preview`
      : `${filename.slice(0, dotIndex)}.preview${filename.slice(dotIndex)}`;
  return buildVideoSrc(previewName);
};

const slugFromFilename = (filename: string) => {
  const dotIndex = filename.lastIndexOf(".");
  const stem = dotIndex === -1 ? filename : filename.slice(0, dotIndex);
  return stem
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_.-]/g, "");
};

const buildHlsMasterSrc = (filename: string) => {
  const slug = slugFromFilename(filename);
  return `/available_cameras/hls/${slug}/master.m3u8`;
};

const buildHlsVariantSrc = (filename: string, variant: string) => {
  const slug = slugFromFilename(filename);
  return `/available_cameras/hls/${slug}/${slug}_${variant}.m3u8`;
};

export default function Home() {
  const cameras = useMemo(
    () =>
      cameraFiles.map((camera) => ({
        ...camera,
        src: buildVideoSrc(camera.filename),
        previewSrc: buildPreviewSrc(camera.filename),
        hlsMasterSrc: buildHlsMasterSrc(camera.filename),
        hlsPreviewSrc: buildHlsVariantSrc(camera.filename, PREVIEW_VARIANT),
      })),
    [],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [aspectRatios, setAspectRatios] = useState(() =>
    cameras.map(() => 16 / 9),
  );
  const [isCompact, setIsCompact] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const pendingSeekRef = useRef<{ index: number; time: number } | null>(null);
  const hlsConstructorRef = useRef<null | typeof import("hls.js").default>(null);
  const hlsInstances = useRef<(Hls | null)[]>([]);

  const videoSources = useMemo(
    () =>
      cameras.map((camera, index) => {
        if (index === activeIndex) {
          return camera.hlsMasterSrc ?? camera.src;
        }
        return camera.hlsPreviewSrc ?? camera.previewSrc ?? camera.src;
      }),
    [activeIndex, cameras],
  );

  const destroyInstance = useCallback((index: number) => {
    const existing = hlsInstances.current[index];
    if (existing) {
      existing.destroy();
      hlsInstances.current[index] = null;
    }
  }, []);

  const attachStream = useCallback(
    (index: number, src: string) => {
      const video = videoRefs.current[index];
      if (!video || !src) return;
      if (video.dataset.hlsSrc === src) return;
      video.dataset.hlsSrc = src;
      destroyInstance(index);

      const requestAutoplay = () => {
        const playPromise = video.play();
        if (playPromise) {
          playPromise.catch(() => undefined);
        }
      };

      const ensureAutoplay = () => {
        if (video.readyState >= 1) {
          requestAutoplay();
        } else {
          video.addEventListener("loadedmetadata", requestAutoplay, { once: true });
        }
      };

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        video.load();
        ensureAutoplay();
        return;
      }

      let active = true;
      const expectedSrc = src;

      const setupHls = async () => {
        if (!hlsConstructorRef.current) {
          const mod = await import("hls.js");
          hlsConstructorRef.current = mod.default;
        }
        if (!active || video.dataset.hlsSrc !== expectedSrc) {
          return;
        }
        const HlsConstructor = hlsConstructorRef.current;
        if (!HlsConstructor || !HlsConstructor.isSupported()) {
          video.src = src;
          video.load();
          ensureAutoplay();
          return;
        }

        const hls = new HlsConstructor({
          enableWorker: true,
          lowLatencyMode: false,
        });
        hlsInstances.current[index] = hls;
        hls.attachMedia(video);

        hls.on(HlsConstructor.Events.MEDIA_ATTACHED, () => {
          hls.loadSource(src);
        });

        hls.on(HlsConstructor.Events.MANIFEST_PARSED, ensureAutoplay);

        hls.on(HlsConstructor.Events.ERROR, (_event, data) => {
          if (data?.fatal) {
            hls.destroy();
            hlsInstances.current[index] = null;
          }
        });
      };

      setupHls();

      return () => {
        active = false;
      };
    },
    [destroyInstance],
  );

  const selectCamera = useCallback(
    (nextIndex: number) => {
      if (nextIndex === activeIndex) return;

      const currentVideo = videoRefs.current[activeIndex];
      if (currentVideo) {
        const anchorTime = currentVideo.currentTime;
        if (Number.isFinite(anchorTime)) {
          pendingSeekRef.current = { index: nextIndex, time: anchorTime };
        } else {
          pendingSeekRef.current = null;
        }
      } else {
        pendingSeekRef.current = null;
      }

      setActiveIndex(nextIndex);
    },
    [activeIndex],
  );

  const cycleCamera = useCallback(
    (direction: 1 | -1) => {
      const nextIndex =
        (activeIndex + direction + cameras.length) % cameras.length;
      selectCamera(nextIndex);
    },
    [activeIndex, cameras.length, selectCamera],
  );

  useEffect(() => {
    const video = videoRefs.current[activeIndex];
    if (!video) return;

    video.muted = isMuted;
    const attemptPlayback = () => {
      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch(() => {
          /* ignore autoplay rejection */
        });
      }
    };

    if (video.readyState >= 1) {
      attemptPlayback();
    } else {
      video.addEventListener("loadedmetadata", attemptPlayback, { once: true });
    }
  }, [activeIndex, isMuted]);
  useEffect(() => {
    videoSources.forEach((src, index) => {
      attachStream(index, src);
    });
  }, [videoSources, attachStream]);

  useEffect(() => {
    const instances = hlsInstances.current;
    return () => {
      instances.forEach((instance) => instance?.destroy());
    };
  }, []);


  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth < 640);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const orbitRadius = isCompact ? 38 : 55;
  const thumbWidth = isCompact ? "100px" : "130px";
  const activeWidth = isCompact ? "min(95vw, 360px)" : "min(70vw, 460px)";

  const containerPadding = isCompact
    ? "px-3 py-8"
    : "px-4 py-12";

  const handleKeyPress = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowRight") {
        cycleCamera(1);
      } else if (event.key === "ArrowLeft") {
        cycleCamera(-1);
      }
    },
    [cycleCamera],
  );

  return (
    <div
      className={`min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-zinc-900 ${containerPadding} text-white`}
    >
      <main
        className="mx-auto flex w-full max-w-6xl flex-col gap-8 sm:gap-12"
        onKeyDown={handleKeyPress}
        tabIndex={0}
        role="application"
        aria-label="Galeria circular multicanais"
      >
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center shadow-2xl backdrop-blur sm:p-8 sm:text-left">
          <p className="text-xs uppercase tracking-[0.35em] text-white/50 sm:text-sm">
            câmeras sincronizadas
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Reprodução perfeita em múltiplos ângulos
          </h1>
          <p className="mt-4 text-sm text-white/70 sm:max-w-xl sm:text-base">
            Circule ao redor do tatame e troque de câmera sem perder o instante.
            Cada mudança mantém o mesmo timestamp para analisar cada posição em
            qualquer perspectiva imediatamente.
          </p>
        </section>
        <section>
          <div className="relative mx-auto aspect-square w-full max-w-full sm:max-w-[540px] lg:max-w-[680px]">
            {cameras.map((camera, index) => {
              const angle = (index / cameras.length) * 360;
              const radians = ((angle - 90) * Math.PI) / 180;
              const x = 50 + Math.cos(radians) * orbitRadius;
              const y = 50 + Math.sin(radians) * orbitRadius;
              const ratio = aspectRatios[index] || 16 / 9;
              const isActive = index === activeIndex;

              const baseStyles = isActive
                ? {
                  top: "50%",
                  left: "50%",
                  width: activeWidth,
                  aspectRatio: ratio,
                  transform: "translate(-50%, -50%)",
                  zIndex: 20,
                }
                : {
                  top: `${y}%`,
                  left: `${x}%`,
                  width: thumbWidth,
                  aspectRatio: ratio,
                  transform: "translate(-50%, -50%)",
                  zIndex: 5,
                };

              return (
                <button
                  key={camera.filename}
                  type="button"
                  onClick={() => selectCamera(index)}
                  className={`group absolute overflow-hidden rounded-3xl border border-white/15 bg-black/40 shadow-[0_15px_35px_rgba(0,0,0,0.35)] transition duration-300 ${isActive ? "hover:border-emerald-200" : "hover:border-white/40"
                    }`}
                  style={baseStyles}
                  aria-pressed={isActive}
                  aria-label={`Selecionar ${camera.label}`}
                >
                  <video
                    ref={(node) => {
                      videoRefs.current[index] = node;
                    }}
                    className={`h-full w-full object-cover ${isActive
                      ? "opacity-100"
                      : "opacity-80 group-hover:opacity-100"
                      }`}
                    playsInline
                    loop
                    muted={isMuted || !isActive}
                    preload="auto"
                    controls={false}
                    onLoadedMetadata={(event) => {
                      const video = event.currentTarget;
                      if (!video.videoWidth || !video.videoHeight) {
                        return;
                      }
                      const newRatio = video.videoWidth / video.videoHeight;
                      setAspectRatios((prev) => {
                        if (prev[index] === newRatio) {
                          return prev;
                        }
                        const next = [...prev];
                        next[index] = newRatio;
                        return next;
                      });

                      const pendingSeek = pendingSeekRef.current;
                      if (pendingSeek && pendingSeek.index === index) {
                        const duration = video.duration || pendingSeek.time;
                        const safeTime = duration
                          ? Math.min(pendingSeek.time, Math.max(duration - 0.15, 0))
                          : pendingSeek.time;
                        try {
                          video.currentTime = safeTime;
                        } catch (seekError) {
                          console.warn("Unable to sync camera", seekError);
                        } finally {
                          pendingSeekRef.current = null;
                        }
                      }
                    }}
                  />
                  <span
                    className={`pointer-events-none absolute inset-x-4 bottom-4 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${isActive
                      ? "bg-black/70 text-emerald-200"
                      : "bg-black/50 text-white/80"
                      }`}
                  >
                    {camera.label}
                  </span>
                </button>
              );
            })}
            <div className="pointer-events-none absolute inset-0 rounded-full border border-dashed border-white/15" />
          </div>
        </section>

        <section className="mt-4 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-center shadow-2xl backdrop-blur sm:text-left lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">
            controles das câmeras
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <button
              className="w-full rounded-full border border-white/30 px-5 py-2 text-sm font-medium uppercase tracking-wide text-white transition hover:border-white sm:w-auto"
              onClick={() => cycleCamera(-1)}
            >
              Anterior • {cameras[(activeIndex - 1 + cameras.length) % cameras.length].label}
            </button>
            <button
              className="w-full rounded-full border border-white/30 px-5 py-2 text-sm font-medium uppercase tracking-wide text-white transition hover:border-white sm:w-auto"
              onClick={() => cycleCamera(1)}
            >
              Próxima • {cameras[(activeIndex + 1) % cameras.length].label}
            </button>
            <button
              className="w-full rounded-full border border-emerald-400/60 bg-emerald-500/20 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-emerald-200 transition hover:border-emerald-300 hover:bg-emerald-500/30 sm:w-auto"
              onClick={() => setIsMuted((prev) => !prev)}
            >
              {isMuted ? "Ativar áudio" : "Silenciar áudio"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
