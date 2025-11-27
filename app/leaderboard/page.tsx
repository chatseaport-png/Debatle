"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ranks, getRankByElo } from "@/lib/rankSystem";
import { StoredUser } from "@/lib/types";

interface LeaderboardRow {
  rank: number;
  username: string;
  elo: number;
  wins: number;
  losses: number;
  winRate: number;
}

const parseStoredUser = (rawValue: string | null): StoredUser | null => {
  if (!rawValue) return null;
  try {
    return JSON.parse(rawValue) as StoredUser;
  } catch (error) {
    console.error("Failed to parse stored user", error);
    return null;
  }
};

// No longer needed - using ensureSeedUsers instead
// const parseStoredUsers = (rawValue: string | null): StoredUser[] => {
//   if (!rawValue) return [];
//   try {
//     const parsed = JSON.parse(rawValue) as StoredUser[];
//     return Array.isArray(parsed) ? parsed : [];
//   } catch (error) {
//     console.error("Failed to parse stored users", error);
//     return [];
//   }
// };

const safeNumber = (value: unknown): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeStoredUser = (user: StoredUser): StoredUser => ({
  ...user,
  elo: safeNumber(user.elo),
  rankedWins: safeNumber(user.rankedWins),
  rankedLosses: safeNumber(user.rankedLosses)
});

const computeLeaderboardRows = (users: StoredUser[]): LeaderboardRow[] =>
  users
    .map((user) => {
      const wins = user.rankedWins ?? 0;
      const losses = user.rankedLosses ?? 0;
      const totalMatches = wins + losses;
      return {
        username: user.username,
        elo: user.elo ?? 0,
        wins,
        losses,
        winRate: totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0
      };
    })
    .sort((a, b) => b.elo - a.elo)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
const dedupeUsers = (users: StoredUser[]): StoredUser[] => {
  const deduped = new Map<string, StoredUser>();
  users.forEach((user) => {
    if (!user.username) return;
    const key = user.username.toLowerCase();
    const existing = deduped.get(key);
    const merged = existing
      ? {
          ...existing,
          ...user,
          elo: user.elo ?? existing.elo ?? 0,
          rankedWins: user.rankedWins ?? existing.rankedWins ?? 0,
          rankedLosses: user.rankedLosses ?? existing.rankedLosses ?? 0,
          profileIcon: user.profileIcon ?? existing.profileIcon,
          profileBanner: user.profileBanner ?? existing.profileBanner
        }
      : user;
    deduped.set(key, normalizeStoredUser(merged));
  });
  return Array.from(deduped.values());
};

const mergeWithSessionUser = (users: StoredUser[], sessionUser: StoredUser | null): StoredUser[] => {
  const deduped = dedupeUsers(users);
  if (!sessionUser?.username) {
    return deduped;
  }

  const index = deduped.findIndex((candidate) => candidate.username === sessionUser.username);
  if (index === -1) {
    return [...deduped, normalizeStoredUser(sessionUser)];
  }

  const updated = [...deduped];
  updated[index] = normalizeStoredUser({
    ...updated[index],
    ...sessionUser,
    elo: sessionUser.elo ?? updated[index].elo,
    rankedWins: sessionUser.rankedWins ?? updated[index].rankedWins,
    rankedLosses: sessionUser.rankedLosses ?? updated[index].rankedLosses,
    profileIcon: sessionUser.profileIcon ?? updated[index].profileIcon,
    profileBanner: sessionUser.profileBanner ?? updated[index].profileBanner
  });
  return updated;
};

export default function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardRow[]>([]);
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshLeaderboard = useCallback(async () => {
    if (typeof window === "undefined") return;

    setIsLoading(true);
    setError(null);

    const sessionUserRaw = parseStoredUser(window.localStorage.getItem("debatel_user"));
    const sessionUser = sessionUserRaw ? normalizeStoredUser(sessionUserRaw) : null;
    setCurrentUser(sessionUser);

    const applyUsers = (users: StoredUser[]) => {
      const mergedUsers = mergeWithSessionUser(users, sessionUser);
      setLeaderboardData(computeLeaderboardRows(mergedUsers));
    };

    try {
      const response = await fetch("/api/users", { cache: "no-store" });
      const payload = await response.json().catch(() => ({ message: "Failed to load leaderboard" }));
      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to load leaderboard");
      }

      const serverUsers = (payload.users as StoredUser[] | undefined) ?? [];
      if (serverUsers.length > 0) {
        window.localStorage.setItem("debatel_users", JSON.stringify(serverUsers));
      }
      applyUsers(serverUsers);
    } catch (err) {
      console.error("Failed to fetch leaderboard", err);
      setError("Unable to reach server. Showing cached data.");
      const cachedRaw = window.localStorage.getItem("debatel_users");
      let cachedUsers: StoredUser[] = [];
      if (cachedRaw) {
        try {
          cachedUsers = JSON.parse(cachedRaw) as StoredUser[];
        } catch (parseError) {
          console.error("Failed to parse cached users", parseError);
        }
      }
      applyUsers(cachedUsers);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshLeaderboard();
  }, [refreshLeaderboard]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key.startsWith("debatel_")) {
        refreshLeaderboard();
      }
    };

    const handleUsersUpdated = () => refreshLeaderboard();
    const handleFocus = () => refreshLeaderboard();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("debatelUsersUpdated", handleUsersUpdated);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("debatelUsersUpdated", handleUsersUpdated);
    };
  }, [refreshLeaderboard]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="border-2 border-black bg-white px-3 py-1 text-3xl font-bold tracking-tight text-black">
              DEBATEL
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/lobby" className="font-medium text-black hover:text-gray-600">
                Lobby
              </Link>
              <Link href="/profile" className="font-medium text-black hover:text-gray-600">
                Profile
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-12">
        {error && (
          <div className="mb-6 rounded-md border border-yellow-500 bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-800">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="mb-6 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Loading leaderboard...
          </div>
        )}

        {/* Rank Tiers */}
  <div className="mb-10 border-2 border-black bg-linear-to-b from-white to-gray-50 p-8 shadow-lg">
          <h2 className="mb-6 text-center text-3xl font-bold text-black">Rank Tiers</h2>
          <div className="mb-6 mx-auto max-w-2xl rounded-lg bg-white border-2 border-gray-300 p-4 text-center text-sm text-gray-700 shadow-sm">
            <strong>Ranking System:</strong> Each rank has 3 sub-ranks (1, 2, 3). Each sub-rank requires 100 ELO. 
            Win: +30-45 ELO • Loss: -30 ELO
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {ranks.map((rank) => (
              <div
                key={rank.name}
                className="group relative flex flex-col items-center justify-center rounded-xl border-2 bg-white p-5 transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:z-10"
                style={{ 
                  borderColor: rank.bgColor,
                }}
              >
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity" 
                     style={{ backgroundColor: rank.bgColor }}></div>
                <span className="text-5xl mb-3 drop-shadow-md">{rank.icon}</span>
                <div className="font-bold text-base text-center mb-1 z-10" style={{ color: rank.bgColor }}>
                  {rank.name}
                </div>
                <div className="text-xs text-gray-600 text-center font-medium z-10">
                  {rank.minElo}-{rank.maxElo === Infinity ? '∞' : rank.maxElo}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-12 border-b border-gray-200 pb-8">
          <h1 className="text-5xl font-bold text-black">Global Rankings</h1>
          <p className="mt-3 text-gray-600">All registered debaters by ELO rating</p>
        </div>

        <div className="border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-black bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-black">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-black">Debater</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-black">ELO</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-black">Wins</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-black">Losses</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-black">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaderboardData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No players ranked yet. Be the first to compete!
                    </td>
                  </tr>
                ) : (
                  leaderboardData.map((player, index) => (
                    <tr
                      key={`${player.username}-${index}`}
                      className={`${
                        currentUser && player.username === currentUser.username ? "bg-black text-white" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold">{player.rank}</span>
                          {index < 3 && (
                            <span className="text-2xl">
                              {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {player.username}
                            {currentUser && player.username === currentUser.username && (
                              <span className="ml-2 text-xs">(You)</span>
                            )}
                          </span>
                          <span className="text-sm" style={{ color: getRankByElo(player.elo).bgColor }}>
                            {getRankByElo(player.elo).icon}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-bold">{player.elo}</span>
                      </td>
                      <td className="px-6 py-5">{player.wins}</td>
                      <td className="px-6 py-5">{player.losses}</td>
                      <td className="px-6 py-5">{player.winRate}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/lobby"
            className="inline-block rounded-sm bg-black px-12 py-4 font-semibold text-white transition hover:bg-gray-800"
          >
            Return to Lobby
          </Link>
        </div>
      </main>
    </div>
  );
}
