"use client";

import { useEffect, useState } from "react";

export function AnimatedBackground() {
  const [streams, setStreams] = useState<{ id: number; left: string; delay: string; duration: string; height: string }[]>([]);

  useEffect(() => {
    // Generate 40 random cryptographic data streams
    const newStreams = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 7}s`,
      duration: `${3 + Math.random() * 5}s`,
      height: `${50 + Math.random() * 150}px`
    }));
    setStreams(newStreams);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-black pointer-events-none">
      {/* Geometric Cyber Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Massive Ambient Core Glows */}
      <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen" />
      <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full mix-blend-screen" />

      {/* Cryptographic Data Streams */}
      {streams.map((stream) => (
        <div
          key={stream.id}
          className="absolute top-[-200px] w-[2px] bg-gradient-to-b from-transparent via-blue-500 to-cyan-300"
          style={{
            left: stream.left,
            height: stream.height,
            animation: `dataDrop ${stream.duration} linear ${stream.delay} infinite`,
            opacity: 0.8,
            boxShadow: "0 0 20px 2px rgba(59, 130, 246, 0.5)"
          }}
        />
      ))}

      {/* Bottom fade out guard */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black via-black/80 to-transparent" />

      {/* Global CSS Animation for the Streams */}
      <style>{`
        @keyframes dataDrop {
          0% { transform: translateY(-200px); opacity: 0; }
          10% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(120vh); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
