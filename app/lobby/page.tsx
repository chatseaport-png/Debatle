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
  const [privateTab, setPrivateTab] = useState<"create" | "join">("create");
  const [privateMode, setPrivateMode] = useState<GameMode>("standard");
  const [privateSide, setPrivateSide] = useState<DebateSide>("for");
  const [privateJoinMode, setPrivateJoinMode] = useState<GameMode>("standard");
  const [privateJoinSide, setPrivateJoinSide] = useState<DebateSide>("against");
  const [privateJoinCode, setPrivateJoinCode] = useState("");
  const [createdLobbyCode, setCreatedLobbyCode] = useState<string | null>(null);
  const [isCreatingLobby, setIsCreatingLobby] = useState(false);
  const [isJoiningLobby, setIsJoiningLobby] = useState(false);
  const [privateStatus, setPrivateStatus] = useState<string | null>(null);
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

    const handleLobbyCreated = ({
      code,
      mode,
      side
    }: {
      code: string;
      mode?: GameMode;
      side?: DebateSide;
    }) => {
      setIsCreatingLobby(false);
      setCreatedLobbyCode(code);
  setPrivateStatus(`Share code ${code} with your opponent. Waiting for one debater to join.`);

      if (mode === "speed" || mode === "standard") {
        setPrivateMode(mode);
        setSelectedMode(mode);
      }

      if (side === "for" || side === "against") {
        setPrivateSide(side);
        setSelectedSide(side);
      }

      setSelectedType("practice");
    };

    const handleLobbyCancelled = ({ reason }: { reason?: string } = {}) => {
      setCreatedLobbyCode(null);
      setIsCreatingLobby(false);
      setPrivateStatus(reason ?? "Private lobby closed.");
    };

    const handleLobbyError = ({ message }: { message?: string } = {}) => {
      setIsCreatingLobby(false);
      setIsJoiningLobby(false);
      setPrivateStatus(message ?? "Unable to process private lobby request.");
    };

    socket.on("private-lobby-created", handleLobbyCreated);
    socket.on("private-lobby-cancelled", handleLobbyCancelled);
    socket.on("private-lobby-error", handleLobbyError);

    return () => {
      socket.off("private-lobby-created", handleLobbyCreated);
      socket.off("private-lobby-cancelled", handleLobbyCancelled);
      socket.off("private-lobby-error", handleLobbyError);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handleMatchFound = ({
      matchId,
      opponent,
      yourSide,
      goesFirst,
      topicIndex,
      mode: matchMode,
      type: matchType
    }: {
      matchId: string;
      opponent: { username: string; elo?: number; icon?: string; banner?: string };
      yourSide: DebateSide;
      goesFirst: boolean;
      topicIndex?: number;
      mode?: GameMode;
      type?: GameType;
    }) => {
      const resolvedMode: GameMode = matchMode === "speed" || matchMode === "standard" ? matchMode : selectedMode;
      const resolvedType: GameType = matchType === "ranked" || matchType === "practice" ? matchType : selectedType;

      console.log("Match found!", {
        matchId,
        opponent,
        yourSide,
        goesFirst,
        topicIndex,
        mode: resolvedMode,
        type: resolvedType
      });

      if (inQueue) {
        setInQueue(false);
      }

      setSelectedMode(resolvedMode);
      setSelectedType(resolvedType);
      setCreatedLobbyCode(null);
      setIsCreatingLobby(false);
      setIsJoiningLobby(false);
      setPrivateStatus(null);

      router.push(`/debate?mode=${resolvedMode}&side=${yourSide}&matchId=${matchId}&multiplayer=true&goesFirst=${goesFirst}&type=${resolvedType}&opponentUsername=${encodeURIComponent(opponent.username)}&opponentElo=${opponent.elo !== undefined ? opponent.elo : 0}&opponentIcon=${encodeURIComponent(opponent.icon || "👤")}&opponentBanner=${encodeURIComponent(opponent.banner || "#3b82f6")}&userElo=${userElo}&userIcon=${encodeURIComponent(profileIcon)}&userBanner=${encodeURIComponent(profileBanner)}&topicIndex=${topicIndex}`);
    };

    const handleQueueStatus = ({ position }: { position: number }) => {
      console.log("Queue position:", position);
    };

    socket.on("match-found", handleMatchFound);
    socket.on("queue-status", handleQueueStatus);

    return () => {
      socket.off("match-found", handleMatchFound);
      socket.off("queue-status", handleQueueStatus);
    };
  }, [socket, router, selectedMode, selectedType, userElo, profileIcon, profileBanner, inQueue]);

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

  const createPrivateLobby = () => {
    if (!socket || !isConnected) {
      setPrivateStatus("Not connected to server. Please refresh the page.");
      return;
    }

    if (inQueue) {
      leaveQueue();
    }

    setSelectedMode(privateMode);
    setSelectedSide(privateSide);
    setSelectedType("practice");
    setIsCreatingLobby(true);
    setCreatedLobbyCode(null);
    setPrivateStatus("Generating private lobby code...");

    socket.emit("create-private-lobby", {
      mode: privateMode,
      side: privateSide,
      username,
      elo: userElo,
      icon: profileIcon,
      banner: profileBanner
    });
  };

  const cancelPrivateLobby = () => {
    if (!socket || !createdLobbyCode) return;

    socket.emit("cancel-private-lobby", { code: createdLobbyCode });
    setCreatedLobbyCode(null);
    setIsCreatingLobby(false);
    setPrivateStatus("Private lobby closed.");
  };

  const joinPrivateLobby = () => {
    if (!socket || !isConnected) {
      setPrivateStatus("Not connected to server. Please refresh the page.");
      return;
    }

    const trimmedCode = privateJoinCode.trim().toUpperCase();
    if (trimmedCode.length < 6) {
      setPrivateStatus("Enter the full access code (6 characters).");
      return;
    }

    if (inQueue) {
      leaveQueue();
    }

    setPrivateJoinCode(trimmedCode);
    setSelectedMode(privateJoinMode);
    setSelectedSide(privateJoinSide);
    setSelectedType("practice");
    setIsJoiningLobby(true);
    setPrivateStatus("Requesting access to private lobby...");

    socket.emit("join-private-lobby", {
      code: trimmedCode,
      mode: privateJoinMode,
      side: privateJoinSide,
      username,
      elo: userElo,
      icon: profileIcon,
      banner: profileBanner
    });
  };

  const copyLobbyCode = async () => {
    if (!createdLobbyCode || typeof navigator === "undefined" || !navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(createdLobbyCode);
      setPrivateStatus("Lobby code copied to clipboard.");
    } catch (error) {
      console.error("Failed to copy lobby code", error);
      setPrivateStatus("Unable to copy code automatically. Copy it manually.");
    }
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
                <div className="text-3xl font-bold text-black">{rankedWins}</div>
                <div className="text-xs uppercase tracking-wide text-gray-600">Wins</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-black">{rankedLosses}</div>
                <div className="text-xs uppercase tracking-wide text-gray-600">Losses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-black">
                  {rankedWins + rankedLosses > 0
                    ? Math.round((rankedWins / (rankedWins + rankedLosses)) * 100)
                    : 0}%
                </div>
                <div className="text-xs uppercase tracking-wide text-gray-600">Win Rate</div>
              </div>
            </div>
          </div>
        )}

        {/* Private Matchmaking */}
        <section className="mb-6 border border-gray-300 bg-white p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-black">Private Matchmaking Lounge</h3>
              <p className="mt-1 text-sm text-gray-600">
                Create or join a code-protected debate. Private matches are practice-only and never impact ELO.
              </p>
            </div>
          </div>

          <div className="mt-6 inline-flex rounded-md border border-gray-200 bg-gray-100 p-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
            <button
              onClick={() => setPrivateTab("create")}
              className={`rounded-md px-4 py-2 transition ${
                privateTab === "create"
                  ? "bg-white text-black shadow"
                  : "text-gray-500 hover:text-black"
              }`}
              type="button"
            >
              Create Lobby
            </button>
            <button
              onClick={() => setPrivateTab("join")}
              className={`rounded-md px-4 py-2 transition ${
                privateTab === "join"
                  ? "bg-white text-black shadow"
                  : "text-gray-500 hover:text-black"
              }`}
              type="button"
            >
              Join Lobby
            </button>
          </div>

          {privateTab === "create" ? (
            <div className="mt-6 space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-black">Time Control</h4>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <button
                    onClick={() => setPrivateMode("speed")}
                    className={`border-2 p-4 text-left transition ${
                      privateMode === "speed"
                        ? "border-black bg-gray-50"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                    type="button"
                  >
                    <div className="mb-1 font-bold text-black">Speed</div>
                    <div className="text-xs text-gray-600">30 seconds per turn</div>
                  </button>
                  <button
                    onClick={() => setPrivateMode("standard")}
                    className={`border-2 p-4 text-left transition ${
                      privateMode === "standard"
                        ? "border-black bg-gray-50"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                    type="button"
                  >
                    <div className="mb-1 font-bold text-black">Standard</div>
                    <div className="text-xs text-gray-600">60 seconds per turn</div>
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-black">Pick Your Side</h4>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <button
                    onClick={() => setPrivateSide("for")}
                    className={`border-2 p-4 text-left transition ${
                      privateSide === "for"
                        ? "border-black bg-gray-50"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                    type="button"
                  >
                    <div className="mb-1 font-bold text-black">FOR</div>
                    <div className="text-xs text-gray-600">You&apos;ll defend the proposition.</div>
                  </button>
                  <button
                    onClick={() => setPrivateSide("against")}
                    className={`border-2 p-4 text-left transition ${
                      privateSide === "against"
                        ? "border-black bg-gray-50"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                    type="button"
                  >
                    <div className="mb-1 font-bold text-black">AGAINST</div>
                    <div className="text-xs text-gray-600">You&apos;ll rebut the proposition.</div>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  onClick={createPrivateLobby}
                  className="inline-flex items-center justify-center rounded-sm bg-black px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isCreatingLobby}
                  type="button"
                >
                  {isCreatingLobby ? "Creating..." : "Generate Access Code"}
                </button>
                {createdLobbyCode && (
                  <div className="flex flex-col gap-3 sm:items-end">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Lobby Code</div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-xl font-mono font-bold tracking-[0.4em] text-black">
                        {createdLobbyCode}
                      </span>
                      <button
                        onClick={copyLobbyCode}
                        className="rounded-sm border border-gray-300 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 transition hover:border-black hover:text-black"
                        type="button"
                      >
                        Copy
                      </button>
                    </div>
                    <button
                      onClick={cancelPrivateLobby}
                      className="text-xs font-semibold uppercase tracking-wide text-red-600 hover:text-red-500"
                      type="button"
                    >
                      Cancel Lobby
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold text-black">Access Code</h4>
                  <input
                    value={privateJoinCode}
                    onChange={(event) => setPrivateJoinCode(event.target.value.toUpperCase())}
                    maxLength={6}
                    autoCapitalize="characters"
                    placeholder="Enter code"
                    className="mt-2 w-full border border-gray-300 bg-white px-4 py-3 text-sm uppercase tracking-[0.4em] text-black outline-none transition focus:border-black"
                    type="text"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-black">Time Control</h4>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={() => setPrivateJoinMode("speed")}
                      className={`border-2 p-3 text-left transition ${
                        privateJoinMode === "speed"
                          ? "border-black bg-gray-50"
                          : "border-gray-300 bg-white hover:border-gray-400"
                      }`}
                      type="button"
                    >
                      <div className="text-sm font-bold text-black">Speed</div>
                      <div className="text-[11px] text-gray-600">30 seconds per turn</div>
                    </button>
                    <button
                      onClick={() => setPrivateJoinMode("standard")}
                      className={`border-2 p-3 text-left transition ${
                        privateJoinMode === "standard"
                          ? "border-black bg-gray-50"
                          : "border-gray-300 bg-white hover:border-gray-400"
                      }`}
                      type="button"
                    >
                      <div className="text-sm font-bold text-black">Standard</div>
                      <div className="text-[11px] text-gray-600">60 seconds per turn</div>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-black">Choose Your Side</h4>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <button
                    onClick={() => setPrivateJoinSide("for")}
                    className={`border-2 p-4 text-left transition ${
                      privateJoinSide === "for"
                        ? "border-black bg-gray-50"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                    type="button"
                  >
                    <div className="mb-1 font-bold text-black">FOR</div>
                    <div className="text-xs text-gray-600">Support the proposition (host may reserve this side).</div>
                  </button>
                  <button
                    onClick={() => setPrivateJoinSide("against")}
                    className={`border-2 p-4 text-left transition ${
                      privateJoinSide === "against"
                        ? "border-black bg-gray-50"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                    type="button"
                  >
                    <div className="mb-1 font-bold text-black">AGAINST</div>
                    <div className="text-xs text-gray-600">Challenge the proposition.</div>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  onClick={joinPrivateLobby}
                  className="inline-flex items-center justify-center rounded-sm bg-black px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isJoiningLobby}
                  type="button"
                >
                  {isJoiningLobby ? "Joining..." : "Join Private Lobby"}
                </button>
                <p className="text-xs text-gray-500">
                  Host decides the official side &amp; mode. If there&apos;s a conflict, adjust and rejoin.
                </p>
              </div>
            </div>
          )}

          {privateStatus && (
            <div className="mt-6 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
              {privateStatus}
            </div>
          )}
        </section>

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
