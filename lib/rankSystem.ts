// Rank system based on ELO
export type Rank = {
  name: string;
  minElo: number;
  maxElo: number;
  color: string;
  icon: string;
};

export const ranks: Rank[] = [
  { name: "Bronze", minElo: 0, maxElo: 299, color: "text-amber-700", icon: "🥉" },
  { name: "Silver", minElo: 300, maxElo: 599, color: "text-gray-400", icon: "🥈" },
  { name: "Gold", minElo: 600, maxElo: 899, color: "text-yellow-500", icon: "🥇" },
  { name: "Platinum", minElo: 900, maxElo: 1199, color: "text-cyan-400", icon: "💎" },
  { name: "Diamond", minElo: 1200, maxElo: 1499, color: "text-blue-400", icon: "💠" },
  { name: "Master", minElo: 1500, maxElo: 1799, color: "text-purple-500", icon: "👑" },
  { name: "Grandmaster", minElo: 1800, maxElo: Infinity, color: "text-red-500", icon: "🔥" },
];

export function getRankByElo(elo: number): Rank {
  return ranks.find(rank => elo >= rank.minElo && elo <= rank.maxElo) || ranks[0];
}

export function getDefaultElo(): number {
  return 0; // Starting ELO
}
