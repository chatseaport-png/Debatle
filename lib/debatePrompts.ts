export interface DebatePrompt {
  topic: string;
  description: string;
}

export const debatePrompts: DebatePrompt[] = [
  {
    topic: "Abortion Rights",
    description: "Abortion should be legal without restrictions up to birth"
  },
  {
    topic: "Defund the Police",
    description: "Police departments should be defunded and replaced with community programs"
  },
  {
    topic: "Transgender Athletes",
    description: "Biological males should be allowed to compete in women's sports"
  },
  {
    topic: "Illegal Immigration Amnesty",
    description: "All undocumented immigrants should be granted immediate citizenship"
  },
  {
    topic: "Gun Confiscation",
    description: "The government should confiscate all privately owned firearms"
  },
  {
    topic: "Reparations for Slavery",
    description: "Descendants of slaves should receive direct cash payments from taxpayers"
  },
  {
    topic: "Socialist Economy",
    description: "The United States should transition to a socialist economic system"
  },
  {
    topic: "Cancel Culture",
    description: "People should lose their jobs for controversial social media posts"
  },
  {
    topic: "Affirmative Action",
    description: "Race should be a factor in college admissions and hiring decisions"
  },
  {
    topic: "Open Borders",
    description: "All national borders should be eliminated to allow free migration"
  },
  {
    topic: "Censorship of 'Misinformation'",
    description: "The government should determine what speech constitutes misinformation"
  },
  {
    topic: "Religious Freedom vs LGBT Rights",
    description: "Religious business owners should be forced to serve LGBT customers"
  },
  {
    topic: "Climate Emergency Powers",
    description: "Governments should have emergency powers to enforce climate policies"
  },
  {
    topic: "Child Gender Transitions",
    description: "Minors should be allowed to undergo medical gender transition procedures"
  },
  {
    topic: "Wealth Redistribution",
    description: "The government should seize wealth from billionaires to redistribute"
  },
  {
    topic: "Voter ID Laws",
    description: "Photo ID should be required to vote in all elections"
  },
  {
    topic: "Critical Race Theory",
    description: "Critical Race Theory should be taught in public schools"
  },
  {
    topic: "Big Tech Censorship",
    description: "Social media companies should be allowed to ban political speech"
  },
  {
    topic: "Parental Rights in Education",
    description: "Parents should control what is taught to their children in schools"
  },
  {
    topic: "Drug Legalization",
    description: "All drugs including heroin and fentanyl should be fully legalized"
  }
];

export function getRandomPrompt(): DebatePrompt {
  return debatePrompts[Math.floor(Math.random() * debatePrompts.length)];
}

export type GameMode = "speed" | "standard";

export interface GameModeConfig {
  name: string;
  description: string;
  timePerTurn: number;
  totalRounds: number;
}

export const gameModes: Record<GameMode, GameModeConfig> = {
  speed: {
    name: "Speed Debate",
    description: "Fast-paced debates with 30-second turns",
    timePerTurn: 30,
    totalRounds: 5
  },
  standard: {
    name: "Standard Debate",
    description: "Traditional format with 60-second turns",
    timePerTurn: 60,
    totalRounds: 5
  }
};
