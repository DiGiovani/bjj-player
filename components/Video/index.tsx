import { VideoPlayer } from "./VideoPlayer";
import { VideoHUD } from "./VideoHUD";
import type { Camera } from "@/types";

interface VideoProps {
  cameras: Camera[];
  activeIndex: number;
  videoRefs: React.MutableRefObject<(HTMLVideoElement | null)[]>;
  showControls: boolean;
  volume: number;
  isFullscreen: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onVolumeChange: (value: number) => void;
  onFullscreenToggle: () => void;
  onMouseMove: () => void;
  onMouseLeave: () => void;
}

export const Video = ({
  cameras,
  activeIndex,
  videoRefs,
  showControls,
  volume,
  isFullscreen,
  onPrevious,
  onNext,
  onVolumeChange,
  onFullscreenToggle,
  onMouseMove,
  onMouseLeave,
}: VideoProps) => {
  const activeCamera = cameras[activeIndex];

  return (
    <div
      className="relative w-full h-full rounded-3xl border border-white/20 bg-black shadow-2xl overflow-hidden"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <VideoPlayer cameras={cameras} activeIndex={activeIndex} videoRefs={videoRefs} />
      <VideoHUD
        camera={activeCamera}
        showControls={showControls}
        volume={volume}
        isFullscreen={isFullscreen}
        onPrevious={onPrevious}
        onNext={onNext}
        onVolumeChange={onVolumeChange}
        onFullscreenToggle={onFullscreenToggle}
      />
    </div>
  );
};
