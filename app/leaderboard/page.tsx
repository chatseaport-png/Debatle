import Link from "next/link";
import { ranks } from "@/lib/rankSystem";

const leaderboardData = [
  { rank: 1, username: "You", elo: 0, wins: 0, losses: 0, winRate: 0 },
];

export default function Leaderboard() {
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ranks.map((rank) => (
              <div
                key={rank.name}
                className="flex items-center gap-3 rounded border-2 border-gray-200 p-4 transition hover:border-gray-400"
                style={{ borderColor: rank.color }}
              >
                <span className="text-3xl">{rank.icon}</span>
                <div>
                  <div className="font-bold" style={{ color: rank.color }}>
                    {rank.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {rank.maxElo ? `${rank.minElo}-${rank.maxElo}` : `${rank.minElo}+`} ELO
                  </div>
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
                {leaderboardData.map((player, index) => (
                  <tr
                    key={player.username}
                    className={`${
                      player.username === "You" ? "bg-black text-white" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold">{player.rank}</span>
                        {index < 3 && (
                          <span className="text-xs">
                            {index === 0 ? "★" : index === 1 ? "★" : "★"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-semibold">
                        {player.username}
                        {player.username === "You" && (
                          <span className="ml-2 text-xs">(Your Rank)</span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-bold">{player.elo}</span>
                    </td>
                    <td className="px-6 py-5">{player.wins}</td>
                    <td className="px-6 py-5">{player.losses}</td>
                    <td className="px-6 py-5">{player.winRate}%</td>
                  </tr>
                ))}
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
