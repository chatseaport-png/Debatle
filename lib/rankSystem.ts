// Rank system based on ELO
export type Rank = {
  name: string;
  minElo: number;
  maxElo: number;
  color: string;
  icon: string;
};

export const ranks: Rank[] = [
  { name: "Bronze", minElo: 0, maxElo: 999, color: "text-amber-700", icon: "🥉" },
  { name: "Silver", minElo: 1000, maxElo: 1299, color: "text-gray-400", icon: "🥈" },
  { name: "Gold", minElo: 1300, maxElo: 1599, color: "text-yellow-500", icon: "🥇" },
  { name: "Platinum", minElo: 1600, maxElo: 1899, color: "text-cyan-400", icon: "💎" },
  { name: "Diamond", minElo: 1900, maxElo: 2199, color: "text-blue-400", icon: "💠" },
  { name: "Master", minElo: 2200, maxElo: 2499, color: "text-purple-500", icon: "👑" },
  { name: "Grandmaster", minElo: 2500, maxElo: Infinity, color: "text-red-500", icon: "🔥" },
];

export function getRankByElo(elo: number): Rank {
  return ranks.find(rank => elo >= rank.minElo && elo <= rank.maxElo) || ranks[0];
}

export function getDefaultElo(): number {
  return 1000; // Starting ELO
}
