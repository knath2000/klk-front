"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { AudioPlayerProps } from "./resultsTabs.types";

export default function AudioPlayer({ audioItems, onPlay, currentPlaying }: AudioPlayerProps) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

  useEffect(() => {
    // Update playing state when currentPlaying changes
    if (currentPlaying) {
      const index = audioItems.findIndex(item => item.url === currentPlaying);
      setPlayingIndex(index >= 0 ? index : null);
    } else {
      setPlayingIndex(null);
    }
  }, [currentPlaying, audioItems]);

  const handlePlay = (index: number) => {
    const audioItem = audioItems[index];
    if (!audioItem) return;

    // Stop other audio
    audioRefs.current.forEach((audio, i) => {
      if (i !== index && audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    setPlayingIndex(index);
    onPlay(audioItem.url);
  };

  const handleTimeUpdate = (index: number) => {
    const audio = audioRefs.current[index];
    if (audio) {
      setProgress((audio.currentTime / audio.duration) * 100);
    }
  };

  const handleEnded = (index: number) => {
    setPlayingIndex(null);
    setProgress(0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!audioItems || audioItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No audio available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Audio Pronunciation
      </h3>

      <div className="space-y-4">
        {audioItems.map((audioItem, index) => {
          const isPlaying = playingIndex === index;
          const audioRef = audioRefs.current[index];

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900 mb-1">
                    {audioItem.text}
                  </h4>
                  <p className="text-sm text-gray-600 capitalize">
                    {audioItem.type}
                  </p>
                </div>

                <motion.button
                  onClick={() => handlePlay(index)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
                    isPlaying
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                  aria-label={`${isPlaying ? "Pause" : "Play"} audio for: ${audioItem.text}`}
                >
                  {isPlaying ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </motion.button>
              </div>

              {/* Audio element (hidden) */}
              <audio
                ref={(el) => {
                  audioRefs.current[index] = el;
                }}
                src={audioItem.url}
                onTimeUpdate={() => handleTimeUpdate(index)}
                onEnded={() => handleEnded(index)}
                onLoadedMetadata={() => {
                  // Reset progress when metadata loads
                  setProgress(0);
                }}
                preload="metadata"
                className="hidden"
              />

              {/* Progress bar */}
              {isPlaying && (
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  className="mt-4"
                >
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${progress}%` }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>
                      {audioRef ? formatTime(audioRef.currentTime) : "0:00"}
                    </span>
                    <span>
                      {audioItem.duration ? formatTime(audioItem.duration) : "--:--"}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Waveform visualization placeholder */}
              <div className="mt-4 flex items-end space-x-1 h-8">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className={`w-1 bg-blue-300 rounded-full ${
                      isPlaying ? "bg-blue-500" : ""
                    }`}
                    animate={
                      isPlaying
                        ? {
                            height: Math.random() * 32 + 8,
                            transition: { duration: 0.1, repeat: Infinity, repeatType: "reverse" }
                          }
                        : { height: 8 }
                    }
                    style={{
                      animationDelay: `${i * 0.05}s`,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {audioItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: audioItems.length * 0.1 + 0.2 }}
          className="mt-6 p-4 bg-green-50 rounded-lg"
        >
          <p className="text-sm text-green-700">
            🎵 <strong>Audio Tips:</strong> Click play to hear native pronunciation.
            The waveform shows audio activity in real-time.
          </p>
        </motion.div>
      )}
    </div>
  );
}