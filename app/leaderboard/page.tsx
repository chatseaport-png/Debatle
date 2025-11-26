"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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

const parseStoredUsers = (rawValue: string | null): StoredUser[] => {
  if (!rawValue) return [];
  try {
    const parsed = JSON.parse(rawValue) as StoredUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to parse stored users", error);
    return [];
  }
};

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

const getLeaderboardSnapshot = (): { rows: LeaderboardRow[]; session: StoredUser | null } => {
  if (typeof window === "undefined") {
    return { rows: [], session: null };
  }

  const sessionUser = parseStoredUser(window.localStorage.getItem("debatel_user"));
  let users = parseStoredUsers(window.localStorage.getItem("debatel_users"));

  if (sessionUser) {
    const exists = users.some((user) => user.username === sessionUser.username);
    if (!exists) {
      users = [
        ...users,
        {
          username: sessionUser.username,
          email: sessionUser.email,
          elo: sessionUser.elo ?? 0,
          rankedWins: sessionUser.rankedWins ?? 0,
          rankedLosses: sessionUser.rankedLosses ?? 0,
          profileIcon: sessionUser.profileIcon,
          profileBanner: sessionUser.profileBanner
        }
      ];
      window.localStorage.setItem("debatel_users", JSON.stringify(users));
    }
  }

  return {
    rows: computeLeaderboardRows(users),
    session: sessionUser
  };
};

export default function Leaderboard() {
  const initialSnapshot = useMemo(() => getLeaderboardSnapshot(), []);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardRow[]>(initialSnapshot.rows);
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(initialSnapshot.session);

  const refreshLeaderboard = useCallback(() => {
    const snapshot = getLeaderboardSnapshot();
    setLeaderboardData(snapshot.rows);
    setCurrentUser(snapshot.session);
  }, []);

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
