"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/lib/socket";

type GameMode = "speed" | "standard";
type DebateSide = "for" | "against";

export default function Lobby() {
  const [inQueue, setInQueue] = useState(false);
  const [queueTime, setQueueTime] = useState(0);
  const [selectedMode, setSelectedMode] = useState<GameMode>("standard");
  const [selectedSide, setSelectedSide] = useState<DebateSide>("for");
  const [username] = useState(() => `Player${Math.floor(Math.random() * 9999)}`);
  const router = useRouter();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Listen for match found
    socket.on("match-found", ({ matchId, opponent, yourSide, opponentSide, goesFirst }) => {
      console.log("Match found!", { matchId, opponent, yourSide, goesFirst });
      router.push(`/debate?mode=${selectedMode}&side=${yourSide}&matchId=${matchId}&multiplayer=true&goesFirst=${goesFirst}`);
    });

    socket.on("queue-status", ({ position }) => {
      console.log("Queue position:", position);
    });

    return () => {
      socket.off("match-found");
      socket.off("queue-status");
    };
  }, [socket, router, selectedMode]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (inQueue) {
      interval = setInterval(() => {
        setQueueTime((prev) => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [inQueue]);

  const joinQueue = () => {
    if (!socket || !isConnected) {
      alert("Not connected to server. Please refresh the page.");
      return;
    }
    
    setInQueue(true);
    setQueueTime(0);
    socket.emit("join-queue", {
      mode: selectedMode,
      side: selectedSide,
      username
    });
  };

  const leaveQueue = () => {
    if (socket) {
      socket.emit("leave-queue", { mode: selectedMode });
    }
    setInQueue(false);
    setQueueTime(0);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="border-b border-gray-300 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="border-2 border-black bg-white px-3 py-1 text-2xl font-bold tracking-tight text-black">
              DEBATLE
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/leaderboard" className="text-sm font-medium text-gray-700 hover:text-black">
                Rankings
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-12">
        {/* Player Stats */}
        <div className="mb-6 border border-gray-300 bg-white p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-black">1,450</div>
              <div className="text-xs uppercase tracking-wide text-gray-600">ELO Rating</div>
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <div className="font-bold text-black">24</div>
                <div className="text-xs text-gray-600">Wins</div>
              </div>
              <div>
                <div className="font-bold text-black">18</div>
                <div className="text-xs text-gray-600">Losses</div>
              </div>
              <div>
                <div className="font-bold text-black">57%</div>
                <div className="text-xs text-gray-600">Win Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Mode Selection */}
        <div className="mb-6 border border-gray-300 bg-white p-6">
          <h3 className="mb-4 text-lg font-bold text-black">Select Mode</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <button
              onClick={() => setSelectedMode("speed")}
              className={`border-2 p-4 text-left transition ${
                selectedMode === "speed"
                  ? "border-black bg-gray-50"
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`}
            >
              <div className="mb-1 font-bold text-black">Speed</div>
              <div className="text-xs text-gray-600">30 seconds per turn</div>
            </button>
            <button
              onClick={() => setSelectedMode("standard")}
              className={`border-2 p-4 text-left transition ${
                selectedMode === "standard"
                  ? "border-black bg-gray-50"
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`}
            >
              <div className="mb-1 font-bold text-black">Standard</div>
              <div className="text-xs text-gray-600">60 seconds per turn</div>
            </button>
          </div>
        </div>

        {/* Side Selection */}
        <div className="mb-6 border border-gray-300 bg-white p-6">
          <h3 className="mb-4 text-lg font-bold text-black">Choose Your Side</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <button
              onClick={() => setSelectedSide("for")}
              className={`border-2 p-4 text-left transition ${
                selectedSide === "for"
                  ? "border-black bg-gray-50"
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`}
            >
              <div className="mb-1 font-bold text-black">FOR</div>
              <div className="text-xs text-gray-600">Support the proposition</div>
            </button>
            <button
              onClick={() => setSelectedSide("against")}
              className={`border-2 p-4 text-left transition ${
                selectedSide === "against"
                  ? "border-black bg-gray-50"
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`}
            >
              <div className="mb-1 font-bold text-black">AGAINST</div>
              <div className="text-xs text-gray-600">Oppose the proposition</div>
            </button>
          </div>
        </div>

        {/* Queue Section */}
        <div className="border border-gray-300 bg-white p-8">
          {!inQueue ? (
            <div className="text-center">
              <button
                onClick={joinQueue}
                className="rounded-sm bg-black px-12 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-gray-800"
              >
                Find Match
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="mb-4 text-4xl font-bold text-black">{queueTime}s</div>
              <p className="mb-4 text-sm font-semibold text-gray-700">Finding opponent...</p>
              <div className="mx-auto mb-6 h-1 w-64 overflow-hidden bg-gray-200">
                <div className="h-full animate-pulse bg-black" style={{ width: "70%" }}></div>
              </div>
              <button
                onClick={leaveQueue}
                className="rounded-sm border-2 border-gray-400 bg-white px-8 py-2 text-sm font-semibold text-gray-700 transition hover:border-black hover:text-black"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
