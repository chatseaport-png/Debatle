// Rank system based on ELO with sub-ranks
export type Rank = {
  name: string;
  minElo: number;
  maxElo: number;
  color: string;
  icon: string;
  bgColor: string;
};

export const ranks: Rank[] = [
  { name: "Bronze", minElo: 0, maxElo: 299, color: "text-amber-700", icon: "🥉", bgColor: "#92400e" },
  { name: "Silver", minElo: 300, maxElo: 599, color: "text-gray-400", icon: "🥈", bgColor: "#9ca3af" },
  { name: "Gold", minElo: 600, maxElo: 899, color: "text-yellow-500", icon: "🥇", bgColor: "#eab308" },
  { name: "Platinum", minElo: 900, maxElo: 1199, color: "text-cyan-400", icon: "💎", bgColor: "#22d3ee" },
  { name: "Diamond", minElo: 1200, maxElo: 1499, color: "text-blue-400", icon: "💠", bgColor: "#60a5fa" },
  { name: "Master", minElo: 1500, maxElo: 1799, color: "text-purple-500", icon: "👑", bgColor: "#a855f7" },
  { name: "Grandmaster", minElo: 1800, maxElo: Infinity, color: "text-red-500", icon: "🔥", bgColor: "#ef4444" },
];

export function getSubRank(elo: number): number {
  const rank = ranks.find(r => elo >= r.minElo && elo <= r.maxElo) || ranks[0];
  const eloInRank = elo - rank.minElo;
  const subRank = Math.floor(eloInRank / 100) + 1;
  return Math.min(subRank, 3); // Max sub-rank is 3
}

export function getRankByElo(elo: number): Rank & { subRank: number; displayName: string; progress: number } {
  const baseRank = ranks.find(rank => elo >= rank.minElo && elo <= rank.maxElo) || ranks[0];
  const subRank = getSubRank(elo);
  const displayName = `${baseRank.name} ${subRank}`;
  
  // Calculate progress within current sub-rank (0-100%)
  const eloInRank = elo - baseRank.minElo;
  const eloInSubRank = eloInRank % 100;
  const progress = eloInSubRank;
  
  return { ...baseRank, subRank, displayName, progress };
}

export function getDefaultElo(): number {
  return 0; // Starting ELO
}
