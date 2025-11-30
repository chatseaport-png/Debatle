"use client";
import Link from "next/link";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { ranks, getRankByElo, Rank } from "@/lib/rankSystem";
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

  const renderRankCard = (rank: Rank | undefined): ReactElement | null => {
    if (!rank) return null;
  const rangeLabel = `${rank.minElo}-${rank.maxElo === Infinity ? "Infinity" : rank.maxElo}`;

    return (
      <div
        key={rank.name}
        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-white/30 hover:shadow-[0_20px_45px_rgba(0,0,0,0.55)]"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-50 transition-opacity duration-300 group-hover:opacity-80"
          style={{
            background: `linear-gradient(140deg, ${rank.bgColor}33 0%, ${rank.bgColor}26 40%, transparent 100%)`,
          }}
        />
        <div className="relative z-10 flex items-center justify-between gap-6 px-6 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">Tier</p>
            <h3 className="mt-2 text-lg font-bold uppercase tracking-wide text-white">
              {rank.name}
            </h3>
            <p className="mt-3 text-xs font-medium text-white/60">ELO {rangeLabel}</p>
          </div>
          <div className="rounded-full border border-white/10 bg-slate-950/50 p-4 text-5xl drop-shadow-[0_0_20px_rgba(0,0,0,0.4)]">
            {rank.icon}
          </div>
        </div>
        <div className="relative z-10 border-t border-white/10 px-6 py-3 text-[11px] uppercase tracking-[0.4em] text-white/40">
          {rank.name} Division • Elite Ladder
        </div>
      </div>
    );
  };

  const renderRankRow = (names: string[]) =>
    names
      .map((name) => renderRankCard(ranks.find((rank) => rank.name === name)))
      .filter((card): card is ReactElement => Boolean(card));

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

    const syncLocalUsers = async (): Promise<StoredUser[] | null> => {
      const cachedRaw = window.localStorage.getItem("debatel_users");
      let cachedUsers: StoredUser[] = [];
      if (cachedRaw) {
        try {
          cachedUsers = JSON.parse(cachedRaw) as StoredUser[];
        } catch (parseError) {
          console.error("Failed to parse cached users for sync", parseError);
        }
      }

      const payloadUsers = dedupeUsers([
        ...cachedUsers,
        ...(sessionUser ? [sessionUser] : [])
      ]);

      if (payloadUsers.length === 0) {
        return null;
      }

      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: payloadUsers })
      });

      const payload = await response.json().catch(() => ({ message: "Failed to sync users" }));
      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to sync users");
      }

      const syncedUsers = (payload.users as StoredUser[] | undefined) ?? [];
      if (syncedUsers.length > 0) {
        window.localStorage.setItem("debatel_users", JSON.stringify(syncedUsers));
      }
      return syncedUsers;
    };

    let lastSyncedUsers: StoredUser[] | null = null;

    try {
      lastSyncedUsers = await syncLocalUsers();
    } catch (syncError) {
      console.error("User sync failed", syncError);
    }

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
      if (lastSyncedUsers && lastSyncedUsers.length > 0) {
        applyUsers(lastSyncedUsers);
      } else {
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
      }
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
        <section className="mb-12">
          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-2xl">
            <div className="flex flex-col gap-3 border-b border-white/10 bg-linear-to-r from-slate-900 via-slate-900 to-slate-800 px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Competitive Ladder</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">Competitive Rank Grid</h2>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/70">
                Each division has <span className="font-semibold text-white">three tiers</span> (I, II, III).
                Wins award <span className="text-emerald-300">+30 to +45 ELO</span>; losses cost <span className="text-rose-300">-30 ELO</span>.
              </div>
            </div>

            <div className="px-6 py-8 sm:px-10">
              <div className="space-y-6">
                {/* Top row with centered Grandmaster */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="hidden sm:block" aria-hidden />
                  {renderRankCard(ranks.find((r) => r.name === "Grandmaster")!)}
                  <div className="hidden sm:block" aria-hidden />
                </div>

                {/* Second row */}
                <div className="grid gap-4 sm:grid-cols-3">
                  {renderRankRow(["Master", "Diamond", "Platinum"])}
                </div>

                {/* Third row */}
                <div className="grid gap-4 sm:grid-cols-3">
                  {renderRankRow(["Gold", "Silver", "Bronze"])}
                </div>
              </div>
            </div>
          </div>
        </section>

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
