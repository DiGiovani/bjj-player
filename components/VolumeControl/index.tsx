import { useState } from "react";

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (value: number) => void;
}

export const VolumeControl = ({ volume, onVolumeChange }: VolumeControlProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className="flex items-center gap-2 group"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <button
        className={`text-white hover:text-gray-300 transition-all ${isExpanded ? "px-2.5" : "px-4"
          }`}
        aria-label={volume === 0 ? "Unmute" : "Mute"}
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {volume === 0 ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
          )}
        </svg>
      </button>

      <div
        className={`transition-all duration-300 overflow-hidden ${isExpanded ? "w-32 opacity-100" : "w-0 opacity-0"
          }`}
      >
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => onVolumeChange(parseInt(e.target.value))}
            className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-white/30 accent-emerald-500 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500"
            aria-label="Volume"
          />
          <span className="text-white text-sm font-medium w-8 text-right">
            {volume}%
          </span>
        </div>
      </div>
    </div>
  );
};
