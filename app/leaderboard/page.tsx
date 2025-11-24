"use client";

import Link from "next/link";
import { ranks, getRankByElo } from "@/lib/rankSystem";
import { useEffect, useState } from "react";

export default function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Load all users from localStorage
    const storedUsers = localStorage.getItem("debatel_users");
    const storedUser = localStorage.getItem("debatel_user");
    
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    
    if (storedUsers) {
      const users = JSON.parse(storedUsers);
      // Sort by ELO descending, take top 1000
      const sortedUsers = users
        .sort((a: any, b: any) => (b.elo || 0) - (a.elo || 0))
        .slice(0, 1000)
        .map((user: any, index: number) => ({
          rank: index + 1,
          username: user.username,
          elo: user.elo || 0,
          wins: Math.floor((user.elo || 0) / 30),
          losses: 0,
          winRate: Math.floor((user.elo || 0) / 30) > 0 ? 100 : 0,
        }));
      setLeaderboardData(sortedUsers);
    }
  }, []);

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
        <div className="mb-12 border-b border-gray-200 pb-8">
          <h1 className="text-5xl font-bold text-black">Global Rankings</h1>
          <p className="mt-3 text-gray-600">Top debaters by ELO rating</p>
        </div>

        {/* Rank Tiers */}
        <div className="mb-8 border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-2xl font-bold text-black">Rank Tiers</h2>
          <div className="mb-4 rounded bg-gray-50 p-4 text-sm text-gray-600">
            Each rank has 3 sub-ranks (1, 2, 3). Each sub-rank requires 100 ELO. Gain 30 ELO per win.
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ranks.map((rank) => (
              <div
                key={rank.name}
                className="rounded border-2 p-4 transition hover:border-gray-400"
                style={{ borderColor: rank.bgColor, backgroundColor: `${rank.bgColor}15` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">{rank.icon}</span>
                  <div className="font-bold text-lg" style={{ color: rank.bgColor }}>
                    {rank.name}
                  </div>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>{rank.name} 1: {rank.minElo}-{rank.minElo + 99} ELO</div>
                  <div>{rank.name} 2: {rank.minElo + 100}-{rank.minElo + 199} ELO</div>
                  <div>{rank.name} 3: {rank.minElo + 200}-{rank.maxElo === Infinity ? '∞' : rank.maxElo} ELO</div>
                </div>
              </div>
            ))}
          </div>
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
