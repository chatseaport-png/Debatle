"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/lib/socket";
import { getRankByElo } from "@/lib/rankSystem";
import { StoredUser } from "@/lib/types";

type GameMode = "speed" | "standard";
type DebateSide = "for" | "against";
type GameType = "ranked" | "practice";

export default function Lobby() {
  const [inQueue, setInQueue] = useState(false);
  const [queueTime, setQueueTime] = useState(0);
  const [selectedMode, setSelectedMode] = useState<GameMode>("standard");
  const [selectedSide, setSelectedSide] = useState<DebateSide>("for");
  const [selectedType, setSelectedType] = useState<GameType>("practice");
  const [username, setUsername] = useState(() => `Player${Math.floor(Math.random() * 9999)}`);
  const [userElo, setUserElo] = useState(0);
  const [rankedWins, setRankedWins] = useState(0);
  const [rankedLosses, setRankedLosses] = useState(0);
  const [profileIcon, setProfileIcon] = useState("👤");
  const [profileBanner, setProfileBanner] = useState("#3b82f6");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const { socket, isConnected } = useSocket();

  // Load username from localStorage if logged in and migrate old users
  useEffect(() => {
    const parseUser = (rawValue: string | null): StoredUser | null => {
      if (!rawValue) return null;
      try {
        return JSON.parse(rawValue) as StoredUser;
      } catch (error) {
        console.error("Failed to parse stored user", error);
        return null;
      }
    };

    const parseUsers = (rawValue: string | null): StoredUser[] => {
      if (!rawValue) return [];
      try {
        const parsed = JSON.parse(rawValue) as StoredUser[];
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.error("Failed to parse stored users", error);
        return [];
      }
    };

    const loadUserData = () => {
      const storedUser = parseUser(localStorage.getItem("debatel_user"));
      if (storedUser) {
        const user: StoredUser = { ...storedUser };

        // Check if user has old ELO (1000 or 1500) and reset to 0
        const needsEloMigration = user.elo === 1000 || user.elo === 1500 || (user.elo ?? 0) > 2000;
        const migratedElo = needsEloMigration ? 0 : user.elo ?? 0;
        const migratedIcon = user.profileIcon ?? "👤";
        const migratedBanner = user.profileBanner ?? "#3b82f6";
        const migratedWins = user.rankedWins ?? 0;
        const migratedLosses = user.rankedLosses ?? 0;

        const sessionUser = {
          username: user.username,
          email: user.email,
          elo: migratedElo,
          profileIcon: migratedIcon,
          profileBanner: migratedBanner,
          rankedWins: migratedWins,
          rankedLosses: migratedLosses,
        };

        const needsSessionUpdate =
          needsEloMigration ||
          user.profileIcon === undefined ||
          user.profileBanner === undefined ||
          user.rankedWins === undefined ||
          user.rankedLosses === undefined;

        if (needsSessionUpdate) {
          localStorage.setItem("debatel_user", JSON.stringify(sessionUser));

          // Also update in users array
          const users = parseUsers(localStorage.getItem("debatel_users"));
          if (users.length > 0) {
            const userIndex = users.findIndex((u) => u.username === user.username);
            if (userIndex !== -1) {
              users[userIndex] = {
                ...users[userIndex],
                elo: migratedElo,
                profileIcon: migratedIcon,
                profileBanner: migratedBanner,
                rankedWins: migratedWins,
                rankedLosses: migratedLosses,
              };
              localStorage.setItem("debatel_users", JSON.stringify(users));
              window.dispatchEvent(new Event("debatelUsersUpdated"));
            }
          }
        }

        setUsername(sessionUser.username);
        setUserElo(sessionUser.elo ?? 0);
        setProfileIcon(sessionUser.profileIcon ?? "👤");
        setProfileBanner(sessionUser.profileBanner ?? "#3b82f6");
        setRankedWins(sessionUser.rankedWins ?? 0);
        setRankedLosses(sessionUser.rankedLosses ?? 0);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
        setRankedWins(0);
        setRankedLosses(0);
      }
    };

    loadUserData();

    // Refresh user data when window regains focus (returning from debate)
    const handleFocus = () => {
      loadUserData();
    };

    // Listen for storage changes (from other tabs or manual updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "debatel_user") {
        loadUserData();
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("debatelUsersUpdated", loadUserData);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("debatelUsersUpdated", loadUserData);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for match found
  socket.on("match-found", ({ matchId, opponent, yourSide, goesFirst, topicIndex }) => {
      console.log("Match found!", { matchId, opponent, yourSide, goesFirst, topicIndex });
      setInQueue(false); // Stop queue timer when match is found
      router.push(`/debate?mode=${selectedMode}&side=${yourSide}&matchId=${matchId}&multiplayer=true&goesFirst=${goesFirst}&type=${selectedType}&opponentUsername=${encodeURIComponent(opponent.username)}&opponentElo=${opponent.elo !== undefined ? opponent.elo : 0}&opponentIcon=${encodeURIComponent(opponent.icon || "👤")}&opponentBanner=${encodeURIComponent(opponent.banner || "#3b82f6")}&userElo=${userElo}&userIcon=${encodeURIComponent(profileIcon)}&userBanner=${encodeURIComponent(profileBanner)}&topicIndex=${topicIndex}`);
    });

    socket.on("queue-status", ({ position }) => {
      console.log("Queue position:", position);
    });

    return () => {
      socket.off("match-found");
      socket.off("queue-status");
    };
  }, [socket, router, selectedMode, selectedType, userElo, profileIcon, profileBanner]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;
    
    if (inQueue) {
      interval = setInterval(() => {
        setQueueTime((prev) => prev + 1);
      }, 1000);
      
      // Silent AI fallback for practice mode after 15 seconds
      if (selectedType === "practice") {
        timeout = setTimeout(() => {
          if (socket) {
            socket.emit("leave-queue", { mode: selectedMode, type: selectedType });
          }
          setInQueue(false);
          router.push(`/debate?mode=${selectedMode}&side=${selectedSide}&multiplayer=false&type=practice`);
        }, 15000);
      }
    }
    
    return () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [inQueue, router, selectedMode, selectedSide, selectedType, socket]);

  const joinQueue = () => {
    // Check if user is trying to play ranked without being logged in
    if (selectedType === "ranked" && !isLoggedIn) {
      alert("You must be logged in to play ranked matches. Please sign up or log in.");
      router.push("/login");
      return;
    }

    if (!socket || !isConnected) {
      alert("Not connected to server. Please refresh the page.");
      return;
    }
    
    setInQueue(true);
    setQueueTime(0);
    socket.emit("join-queue", {
      mode: selectedMode,
      side: selectedSide,
      username,
      type: selectedType,
      elo: userElo,
      icon: profileIcon,
      banner: profileBanner
    });
  };

  const leaveQueue = () => {
    if (socket) {
      socket.emit("leave-queue", { mode: selectedMode, type: selectedType });
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
              DEBATEL
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
        {/* Large Rank Emblem - Valorant Style */}
        {isLoggedIn && (
          <div className="mb-8 flex justify-center">
            <div className="text-center">
              <div 
                className="mx-auto mb-4 flex h-40 w-40 items-center justify-center rounded-full border-4 shadow-2xl"
                style={{ 
                  borderColor: getRankByElo(userElo).bgColor,
                  backgroundColor: `${getRankByElo(userElo).bgColor}20`,
                }}
              >
                <span className="text-8xl">{getRankByElo(userElo).icon}</span>
              </div>
              <div className="text-3xl font-bold" style={{ color: getRankByElo(userElo).bgColor }}>
                {getRankByElo(userElo).displayName}
              </div>
              <div className="text-xl text-gray-600">{userElo} ELO</div>
            </div>
          </div>
        )}

        {/* Rank Progress Bar */}
        {isLoggedIn && (
          <div className="mb-6 border-2 border-black bg-white p-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-700">
                Progress to {getRankByElo(userElo).name} {getRankByElo(userElo).subRank + 1}
              </div>
              <div className="text-sm font-bold" style={{ color: getRankByElo(userElo).bgColor }}>
                {getRankByElo(userElo).progress}/100 ELO
              </div>
            </div>
            {/* Progress Bar */}
            <div className="relative h-4 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${getRankByElo(userElo).progress}%`,
                  backgroundColor: getRankByElo(userElo).bgColor,
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Player Stats */}
        {isLoggedIn && (
          <div className="mb-6 border border-gray-300 bg-white p-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-black">{userElo}</div>
                <div className="text-xs uppercase tracking-wide text-gray-600">ELO Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{rankedWins}</div>
                <div className="text-xs uppercase tracking-wide text-gray-600">Wins</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{rankedLosses}</div>
                <div className="text-xs uppercase tracking-wide text-gray-600">Losses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {rankedWins + rankedLosses > 0
                    ? Math.round((rankedWins / (rankedWins + rankedLosses)) * 100)
                    : 0}%
                </div>
                <div className="text-xs uppercase tracking-wide text-gray-600">Win Rate</div>
              </div>
            </div>
          </div>
        )}

        {/* Game Type Selection */}
        <div className="mb-6 border border-gray-300 bg-white p-6">
          <h3 className="mb-4 text-lg font-bold text-black">Game Type</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <button
              onClick={() => setSelectedType("practice")}
              className={`border-2 p-4 text-left transition ${
                selectedType === "practice"
                  ? "border-black bg-gray-50"
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`}
            >
              <div className="mb-1 font-bold text-black">Practice</div>
              <div className="text-xs text-gray-600">Casual matches with other practicing players</div>
            </button>
            <button
              onClick={() => {
                if (!isLoggedIn) {
                  alert("You must be logged in to play ranked matches!");
                  return;
                }
                setSelectedType("ranked");
              }}
              className={`border-2 p-4 text-left transition ${
                selectedType === "ranked"
                  ? "border-black bg-gray-50"
                  : "border-gray-300 bg-white hover:border-gray-400"
              } ${!isLoggedIn ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="mb-1 font-bold text-black">
                Ranked {!isLoggedIn && "🔒"}
              </div>
              <div className="text-xs text-gray-600">
                {isLoggedIn ? "Competitive matches with ELO tracking" : "Login required"}
              </div>
            </button>
          </div>
        </div>

        {/* Game Mode Selection */}
        <div className="mb-6 border border-gray-300 bg-white p-6">
          <h3 className="mb-4 text-lg font-bold text-black">Time Control</h3>
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
              <p className="mb-4 text-sm font-semibold text-gray-700">
                {selectedType === "ranked" 
                  ? "Finding ranked opponent..." 
                  : "Finding practice match..."}
              </p>
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
