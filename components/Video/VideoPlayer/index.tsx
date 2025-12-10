import type { Camera } from "@/types";

interface VideoPlayerProps {
  cameras: Camera[];
  activeIndex: number;
  videoRefs: React.MutableRefObject<(HTMLVideoElement | null)[]>;
}

export const VideoPlayer = ({ cameras, activeIndex, videoRefs }: VideoPlayerProps) => {
  return (
    <div className="relative w-full h-full bg-black">
      {cameras.map((camera, index) => (
        <video
          key={camera.name}
          ref={(el) => (videoRefs.current[index] = el)}
          className={`absolute inset-0 w-full h-full object-contain ${index === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          autoPlay
          playsInline
          muted={false}
          data-camera-name={camera.name}
        />
      ))}
    </div>
  );
};
