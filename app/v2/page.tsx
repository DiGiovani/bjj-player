"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildCameraList, buildHlsMasterSrc } from "@/utils";
import { useControlsVisibility, useFullscreen, useHLSPlayer, useVideoSync } from "@/hooks";
import { Video, CameraSelector, Header } from "@/components";

export default function Home() {
  const cameras = useMemo(() => buildCameraList(), []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [volume, setVolume] = useState(0);

  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Custom hooks
  const { showControls, handleMouseMove, handleMouseLeave } = useControlsVisibility();
  const { isFullscreen, toggleFullscreen } = useFullscreen(videoContainerRef);
  const { attachStream, isLiveStream } = useHLSPlayer({
    cameras,
    videoRefs,
    activeIndex,
  });
  const { syncTime } = useVideoSync({
    cameras,
    videoRefs,
    activeIndex,
    isLiveStream,
  });

  // Camera navigation
  const selectCamera = useCallback(
    (index: number) => {
      const prevIndex = activeIndex;
      setActiveIndex(index);
      syncTime(prevIndex, index);
    },
    [activeIndex, syncTime]
  );

  const nextCamera = useCallback(() => {
    selectCamera((activeIndex + 1) % cameras.length);
  }, [activeIndex, cameras.length, selectCamera]);

  const previousCamera = useCallback(() => {
    selectCamera((activeIndex - 1 + cameras.length) % cameras.length);
  }, [activeIndex, cameras.length, selectCamera]);

  // Volume control
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    videoRefs.current.forEach((video) => {
      if (video) {
        video.volume = newVolume / 100;
        video.muted = newVolume === 0;
      }
    });
  }, []);

  // Initialize HLS streams
  useEffect(() => {
    cameras.forEach((camera, index) => {
      const src = buildHlsMasterSrc(camera.file.slug);
      attachStream(index, src);
    });

    // Initialize volume on mount
    videoRefs.current.forEach((video) => {
      if (video) {
        video.volume = volume / 100;
        video.muted = volume === 0;
      }
    });
  }, [cameras, attachStream, volume]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-zinc-900 px-4 py-8 text-white lg:px-8 lg:py-12">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <Header />

        <div className="grid gap-8 lg:grid-cols-[1fr,auto]">
          {/* Main Video Player */}
          <section className="flex flex-col gap-4">
            <div ref={videoContainerRef}>
              <Video
                cameras={cameras}
                activeIndex={activeIndex}
                videoRefs={videoRefs}
                showControls={showControls}
                volume={volume}
                isFullscreen={isFullscreen}
                onPrevious={previousCamera}
                onNext={nextCamera}
                onVolumeChange={handleVolumeChange}
                onFullscreenToggle={toggleFullscreen}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              />
            </div>
          </section>

          {/* Camera Selector */}
          <CameraSelector
            cameras={cameras}
            activeIndex={activeIndex}
            onSelectCamera={selectCamera}
          />
        </div>
      </main>
    </div>
  );
}
