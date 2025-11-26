export type DebateTurn = "player" | "opponent";

export interface DebateMessage {
  sender: string;
  text: string;
  time: number;
  isYourTurn: boolean;
}

export interface JudgementBreakdown {
  argumentQuality: number;
  logicReasoning: number;
  evidenceFacts: number;
  responseTime: number;
  persuasiveness: number;
}

export interface AiJudgement {
  playerScore: number;
  opponentScore: number;
  winner: "player" | "opponent" | "tie";
  reasoning: string;
  playerBreakdown: JudgementBreakdown;
  opponentBreakdown: JudgementBreakdown;
}

export interface StoredUser {
  username: string;
  email?: string;
  password?: string;
  elo?: number;
  rankedWins?: number;
  rankedLosses?: number;
  profileIcon?: string;
  profileBanner?: string;
  icon?: string;
  banner?: string;
}
