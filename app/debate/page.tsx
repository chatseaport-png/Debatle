"use client";

import Link from "next/link";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getRandomPrompt, getPromptByIndex } from "@/lib/debatePrompts";
import { useSocket } from "@/lib/socket";
import { getRankByElo } from "@/lib/rankSystem";

function DebateRoom() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode") || "standard";
  const userSide = searchParams.get("side") || "for";
  const matchId = searchParams.get("matchId");
  const isMultiplayer = searchParams.get("multiplayer") === "true";
  const goesFirst = searchParams.get("goesFirst") === "true";
  const gameType = searchParams.get("type") || "practice";
  const opponentUsername = searchParams.get("opponentUsername") || "Opponent";
  const opponentElo = parseInt(searchParams.get("opponentElo") || "1000");
  const opponentIcon = searchParams.get("opponentIcon") || "👤";
  const userElo = parseInt(searchParams.get("userElo") || "1000");
  const userIcon = searchParams.get("userIcon") || "👤";
  const topicIndex = searchParams.get("topicIndex");
  const timePerTurn = mode === "speed" ? 30 : 60;
  const totalRounds = 5;

  const { socket } = useSocket();
  const [prompt] = useState(() => 
    topicIndex ? getPromptByIndex(parseInt(topicIndex)) : getRandomPrompt()
  );
  const [position] = useState<"for" | "against">(() => 
    userSide as "for" | "against"
  );
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [messages, setMessages] = useState<Array<{ 
    sender: string; 
    text: string; 
    time: number;
    isYourTurn: boolean;
  }>>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [round, setRound] = useState(0);
  const [yourScore, setYourScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [debateEnded, setDebateEnded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [isJudging, setIsJudging] = useState(false);
  const [aiJudgement, setAiJudgement] = useState<any>(null);
  const [messagesThisRound, setMessagesThisRound] = useState(0);
  const [isReadingBreak, setIsReadingBreak] = useState(false);
  const [nextTurn, setNextTurn] = useState<"player" | "opponent" | null>(null);
  const [pendingDebateEnd, setPendingDebateEnd] = useState(false);
  const READING_DURATION = 10;
  const opponentResponseTimeout = useRef<NodeJS.Timeout | null>(null);

  // Multiplayer socket listeners
  useEffect(() => {
    if (!socket || !isMultiplayer || !matchId) return;

    socket.on("opponent-message", ({ text, time }) => {
      const opponentMsg = {
        sender: "Opponent",
        text,
        time,
        isYourTurn: false
      };
      setMessages(prev => [...prev, opponentMsg]);
      const opponentPoints = Math.floor(Math.random() * 25) + 20;
      setOpponentScore(prev => prev + opponentPoints);
    });

    socket.on("turn-change", ({ currentTurn }) => {
      setIsYourTurn(socket.id === currentTurn);
      setHasSubmitted(false);
      setTimeLeft(timePerTurn);
    });

    socket.on("opponent-disconnected", () => {
      alert("Opponent disconnected. You win by default!");
      router.push("/lobby");
    });

    socket.on("debate-ended", () => {
      if (!debateEnded) {
        endDebate();
      }
    });

    return () => {
      socket.off("opponent-message");
      socket.off("turn-change");
      socket.off("opponent-disconnected");
      socket.off("debate-ended");
    };
  }, [socket, isMultiplayer, matchId, timePerTurn]);

  useEffect(() => {
    return () => {
      if (opponentResponseTimeout.current) {
        clearTimeout(opponentResponseTimeout.current);
      }
    };
  }, []);

  const generateOpponentResponse = () => {
    const opponentMessages_pool = [
      "The empirical evidence contradicts this position. Studies from peer-reviewed journals demonstrate that federal oversight has consistently produced superior outcomes in environmental policy coordination.",
      "Your argument fails to address the constitutional framework. The Commerce Clause explicitly grants Congress authority over interstate matters, which environmental issues inherently are.",
      "I must respectfully disagree. The data from the past three decades shows that state-level initiatives have been undermined by lack of coordination and regulatory arbitrage.",
      "This perspective overlooks the economic externalities. Without federal standards, we create a race to the bottom where states compete by lowering environmental protections.",
      "Historical precedent contradicts your position. The Clean Air Act and Clean Water Act demonstrate the effectiveness of federal environmental regulation.",
      "Your reasoning ignores the tragedy of the commons. Interstate pollution requires interstate solutions, which only federal policy can provide.",
      "The fundamental flaw in your logic is the assumption that localized decision-making produces optimal outcomes when dealing with systemic issues.",
      "International comparisons clearly demonstrate that centralized regulatory frameworks achieve better results than fragmented approaches.",
      "You're overlooking the critical issue of enforcement consistency, which can only be guaranteed through unified federal standards.",
      "The market failures you're ignoring require coordinated intervention that individual states cannot provide independently.",
      "Your position contradicts decades of economic research on collective action problems and regulatory capture at the state level.",
      "The constitutional history you cite actually supports the opposite conclusion when examined in its full historical context.",
      "Evidence from similar policy experiments shows that decentralized approaches consistently fail to address cross-border spillover effects.",
      "The data clearly indicates that race-to-the-bottom dynamics emerge when regulatory authority is devolved to competing jurisdictions.",
      "Your framework ignores the information asymmetries that make state-level regulation inherently less effective than federal oversight.",
      "The precedent you reference has been superseded by more recent jurisprudence that recognizes the necessity of federal coordination.",
      "Research demonstrates that compliance costs actually decrease under unified federal standards compared to navigating 50 different state regimes.",
      "The efficiency argument you make fails to account for the coordination costs and regulatory arbitrage that fragment state systems.",
      "Your position relies on assumptions about state capacity that empirical evidence consistently contradicts.",
      "The success stories you cite are statistical outliers that don't represent the typical outcomes of decentralized policy implementation.",
    ];

    const opponentMsg = {
      sender: "Opponent",
      text: opponentMessages_pool[Math.floor(Math.random() * opponentMessages_pool.length)],
      time: Math.floor(Math.random() * timePerTurn),
      isYourTurn: false
    };

    setMessages(prev => [...prev, opponentMsg]);
    const opponentPoints = Math.floor(Math.random() * 25) + 20;
    setOpponentScore(prev => prev + opponentPoints);
    completeTurn("opponent");
  };

  useEffect(() => {
    if (debateEnded) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : prev));
    }, 1000);

    return () => clearInterval(timer);
  }, [debateEnded]);

  useEffect(() => {
    if (debateEnded || timeLeft > 0) return;

    if (isAnalyzing) {
      setIsAnalyzing(false);
      setRound(1);
      setMessagesThisRound(0);
      setPendingDebateEnd(false);
      setNextTurn(null);
      setIsReadingBreak(false);
      const youStart = position === "for" || goesFirst;
      setIsYourTurn(youStart);
      setHasSubmitted(!youStart);
      setTimeLeft(timePerTurn);
      if (!youStart && !isMultiplayer) {
        if (opponentResponseTimeout.current) {
          clearTimeout(opponentResponseTimeout.current);
        }
        const minDelay = 5;
        const maxDelay = Math.max(minDelay + 1, timePerTurn - 5);
        const delaySeconds = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;
        opponentResponseTimeout.current = setTimeout(() => {
          generateOpponentResponse();
          opponentResponseTimeout.current = null;
        }, delaySeconds * 1000);
      }
      return;
    }

    if (isReadingBreak) {
      setIsReadingBreak(false);

      if (pendingDebateEnd && nextTurn === null) {
        setPendingDebateEnd(false);
        endDebate();
        return;
      }

      if (nextTurn === "player") {
        setIsYourTurn(true);
        setHasSubmitted(false);
        setTimeLeft(timePerTurn);
      } else if (nextTurn === "opponent") {
        setIsYourTurn(false);
        setHasSubmitted(true);
        setTimeLeft(timePerTurn);
        if (!isMultiplayer) {
          if (opponentResponseTimeout.current) {
            clearTimeout(opponentResponseTimeout.current);
          }
          const minDelay = 5;
          const maxDelay = Math.max(minDelay + 1, timePerTurn - 5);
          const delaySeconds = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;
          opponentResponseTimeout.current = setTimeout(() => {
            generateOpponentResponse();
            opponentResponseTimeout.current = null;
          }, delaySeconds * 1000);
        }
      } else if (pendingDebateEnd) {
        setPendingDebateEnd(false);
        endDebate();
        return;
      }

      setNextTurn(null);
      return;
    }

    handleTimeUp();
  }, [timeLeft, debateEnded, isAnalyzing, isReadingBreak, isMultiplayer, goesFirst, position, timePerTurn, nextTurn, pendingDebateEnd, generateOpponentResponse]);

  const handleTimeUp = () => {
    const timedOutSpeaker = isYourTurn ? "player" : "opponent";
    const timeoutMsg = {
      sender: isYourTurn ? "You" : "Opponent",
      text: "⏳ No submission received.",
      time: timePerTurn,
      isYourTurn
    };
    setMessages(prev => [...prev, timeoutMsg]);

    if (isYourTurn) {
      setYourScore(prev => Math.max(0, prev - 10));
    } else {
      setOpponentScore(prev => Math.max(0, prev - 10));
    }

    completeTurn(timedOutSpeaker);
  };

  const beginReadingBreak = (upNext: "player" | "opponent" | null) => {
    setIsReadingBreak(true);
    setNextTurn(upNext);
    setTimeLeft(READING_DURATION);
    setHasSubmitted(true);
    setIsYourTurn(false);

    if (opponentResponseTimeout.current) {
      clearTimeout(opponentResponseTimeout.current);
      opponentResponseTimeout.current = null;
    }
  };

  const completeTurn = (speaker: "player" | "opponent") => {
    const wasSecondMessage = messagesThisRound === 1;
    const finalRoundComplete = wasSecondMessage && round >= totalRounds;
    const shouldAdvanceRound = wasSecondMessage && round < totalRounds;
    const nextSpeaker: "player" | "opponent" | null = finalRoundComplete
      ? null
      : speaker === "player"
        ? "opponent"
        : "player";
    const nextCount = wasSecondMessage ? 0 : Math.min(1, messagesThisRound + 1);

    setMessagesThisRound(nextCount);

    if (shouldAdvanceRound) {
      setRound(prev => Math.min(prev + 1, totalRounds));
    }

    if (finalRoundComplete) {
      setPendingDebateEnd(true);
    }

    beginReadingBreak(nextSpeaker);
  };

  const sendMessage = () => {
    if (!currentMessage.trim() || !isYourTurn || hasSubmitted) return;

    const responseTime = timePerTurn - timeLeft;
    const newMessage = {
      sender: "You",
      text: currentMessage,
      time: responseTime,
      isYourTurn: true
    };

    setMessages(prev => [...prev, newMessage]);
    setHasSubmitted(true);
    
    // Calculate score based on response time and length
    const timeBonus = responseTime < timePerTurn / 2 ? 10 : 5;
    const lengthBonus = currentMessage.length > 100 ? 10 : 5;
    const baseScore = Math.floor(Math.random() * 15) + 15;
    const totalScore = baseScore + timeBonus + lengthBonus;
    
    setYourScore(prev => prev + totalScore);
    
    // Send to opponent if multiplayer
    if (isMultiplayer && socket && matchId) {
      socket.emit("send-message", {
        matchId,
        message: currentMessage,
        time: responseTime
      });
    }
    
    setCurrentMessage("");
    completeTurn("player");
  };

  const endDebate = async () => {
    setDebateEnded(true);
    setIsJudging(true);
    setPendingDebateEnd(false);
    setIsReadingBreak(false);
    setNextTurn(null);
    
    // Notify server if multiplayer
    if (isMultiplayer && socket && matchId) {
      socket.emit("end-debate", { matchId });
    }

    // Get AI judgement
    try {
      const playerArguments = messages.filter(m => m.sender === "You");
      const opponentArguments = messages.filter(m => m.sender === "Opponent");

      const response = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: prompt.topic,
          description: prompt.description,
          playerArguments,
          opponentArguments,
          playerSide: position,
        }),
      });

      if (response.ok) {
        const judgement = await response.json();
        setAiJudgement(judgement);
        setYourScore(judgement.playerScore);
        setOpponentScore(judgement.opponentScore);
        
        const resultMsg = {
          sender: "AI Judge",
          text: `${judgement.winner === "player" ? "You win!" : judgement.winner === "opponent" ? "Opponent wins!" : "It's a tie!"}\n\nFinal Scores: You: ${judgement.playerScore} | Opponent: ${judgement.opponentScore}\n\nReasoning: ${judgement.reasoning}`,
          time: 0,
          isYourTurn: false
        };
        setMessages(prev => [...prev, resultMsg]);
      } else {
        // Fallback to simple scoring if API fails
        const winner = yourScore > opponentScore ? "You win!" : yourScore < opponentScore ? "Opponent wins!" : "Draw!";
        const fallbackMsg = {
          sender: "Moderator",
          text: `Scores - You: ${yourScore}, Opponent: ${opponentScore}. ${winner}`,
          time: 0,
          isYourTurn: false
        };
        setMessages(prev => [...prev, fallbackMsg]);
      }
    } catch (error) {
      console.error("Error getting AI judgement:", error);
      const winner = yourScore > opponentScore ? "You win!" : yourScore < opponentScore ? "Opponent wins!" : "Draw!";
      const errorMsg = {
        sender: "Moderator",
        text: `Scores - You: ${yourScore}, Opponent: ${opponentScore}. ${winner}`,
        time: 0,
        isYourTurn: false
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsJudging(false);
    }
  };

  const handleExitClick = (e: React.MouseEvent) => {
    if (!debateEnded) {
      e.preventDefault();
      setShowExitConfirm(true);
    }
  };

  const confirmExit = () => {
    // User loses ranked points for leaving mid-match
    router.push("/lobby?penalty=true");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md border-4 border-black bg-white p-8">
            <h3 className="mb-4 text-2xl font-bold text-black">Leave Match?</h3>
            <p className="mb-6 text-gray-700">
              Leaving mid-match will result in a loss and you will lose ranked points.
            </p>
            <div className="flex gap-4">
              <button
                onClick={confirmExit}
                className="flex-1 bg-black px-6 py-3 font-bold text-white transition hover:bg-gray-800"
              >
                Leave Match
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 border-2 border-gray-400 bg-white px-6 py-3 font-bold text-gray-700 transition hover:border-black"
              >
                Stay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-300 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={handleExitClick} className="text-sm font-medium text-gray-600 hover:text-black">
              ← Exit
            </button>
            <div className="text-center">
              <div className="text-xs uppercase tracking-wider text-gray-500">
                {isAnalyzing
                  ? "Analysis Phase"
                  : debateEnded
                    ? "Judging Phase"
                    : isReadingBreak
                      ? `Round ${round}/${totalRounds} • Reading Break`
                      : `Round ${round}/${totalRounds} • ${isYourTurn ? "Your Turn" : "Opponent's Turn"}`} • {mode === "speed" ? "Speed" : "Standard"} • <span className={gameType === "ranked" ? "font-bold text-black" : "text-gray-400"}>{gameType === "ranked" ? "RANKED" : "Practice"}</span>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold tabular-nums ${timeLeft <= 10 ? "text-red-600" : "text-black"}`}>
                {timeLeft}s
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid gap-4 lg:grid-cols-4">
          {/* Main Debate Area */}
          <div className="lg:col-span-3">
            {/* Topic */}
            <div className="mb-4 border border-gray-300 bg-white p-5">
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Resolution</div>
              <h2 className="mb-2 text-lg font-bold text-black">{prompt.topic}</h2>
              <p className="text-sm text-gray-600">{prompt.description}</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="border-l-4 border-black bg-black px-3 py-2 text-xl font-bold text-white flex items-center gap-2">
                    <span>{userIcon}</span> YOU: {position.toUpperCase()}
                  </span>
                  <span className={`text-xs font-semibold px-3 ${getRankByElo(userElo).color}`}>
                    {getRankByElo(userElo).icon} {getRankByElo(userElo).name} • {userElo} ELO
                  </span>
                </div>
                <span className="text-gray-400 text-2xl">vs</span>
                <div className="flex flex-col gap-1">
                  <span className="border-l-4 border-gray-400 bg-gray-200 px-3 py-2 text-xl font-bold text-gray-700 flex items-center gap-2">
                    <span>{opponentIcon}</span> {opponentUsername.toUpperCase()}: {position === "for" ? "AGAINST" : "FOR"}
                  </span>
                  <span className={`text-xs font-semibold px-3 ${getRankByElo(opponentElo).color}`}>
                    {getRankByElo(opponentElo).icon} {getRankByElo(opponentElo).name} • {opponentElo} ELO
                  </span>
                </div>
              </div>
            </div>

            {/* Turn Indicator */}
            {!debateEnded && !isAnalyzing && !isReadingBreak && (
              <div className={`mb-4 border-l-4 p-4 ${
                isYourTurn 
                  ? "border-green-600 bg-green-100" 
                  : "border-orange-500 bg-orange-50"
              }`}>
                <div className="flex items-center justify-between">
                  <div className={`text-sm font-bold uppercase tracking-wider ${
                    isYourTurn ? "text-green-800" : "text-orange-800"
                  }`}>
                    {isYourTurn ? "🟢 YOUR TURN TO RESPOND" : "🟠 OPPONENT IS RESPONDING"}
                  </div>
                  <div className={`text-xs font-semibold ${
                    isYourTurn ? "text-green-700" : "text-orange-700"
                  }`}>
                    Round {round}/{totalRounds}
                  </div>
                </div>
              </div>
            )}
            
            {isAnalyzing && (
              <div className="mb-4 border-l-4 border-blue-600 bg-blue-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold uppercase tracking-wider text-blue-900">
                    🔵 ANALYSIS PHASE - PREPARE YOUR ARGUMENTS
                  </div>
                  <div className="text-xs font-semibold text-blue-700">
                    60 seconds
                  </div>
                </div>
              </div>
            )}

            {isReadingBreak && !debateEnded && (
              <div className="mb-4 border-l-4 border-purple-600 bg-purple-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold uppercase tracking-wider text-purple-900">
                    🕒 READING WINDOW - REVIEW THE LAST ARGUMENT
                  </div>
                  <div className="text-xs font-semibold text-purple-700">
                    10 seconds
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="mb-4 h-80 overflow-y-auto border border-gray-300 bg-white p-5">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-3 ${
                    msg.sender === "You" ? "ml-8" : msg.sender === "Moderator" ? "text-center" : "mr-8"
                  }`}
                >
                  <div
                    className={`inline-block border-l-2 p-3 ${
                      msg.sender === "You"
                        ? "border-black bg-gray-50"
                        : msg.sender === "Moderator"
                        ? "border-gray-400 bg-gray-100"
                        : "border-gray-400 bg-white"
                    }`}
                  >
                    <div className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-600">
                      {msg.sender}
                    </div>
                    <div className="text-sm leading-relaxed text-black">{msg.text}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            {!debateEnded && (
              <div className="border border-gray-300 bg-white p-4">
                <textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      isYourTurn &&
                      !hasSubmitted &&
                      !isAnalyzing &&
                      !isReadingBreak
                    ) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={isAnalyzing
                    ? "Analyzing topic..."
                    : isReadingBreak
                      ? "Reading window in progress..."
                      : isYourTurn
                        ? "Enter argument... (Enter to submit)"
                        : "Waiting..."}
                  disabled={!isYourTurn || hasSubmitted || isAnalyzing || isReadingBreak}
                  className="w-full resize-none border border-gray-200 p-3 text-sm text-black placeholder-gray-400 focus:border-black focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                  rows={3}
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={sendMessage}
                    disabled={!isYourTurn || hasSubmitted || !currentMessage.trim() || isAnalyzing || isReadingBreak}
                    className="rounded-sm bg-black px-6 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}

            {debateEnded && (
              <div className="border border-gray-300 bg-white p-8">
                <h3 className="mb-4 text-center text-xl font-bold text-black">
                  {isJudging ? "AI Analyzing..." : "Debate Complete"}
                </h3>
                
                {!isJudging && aiJudgement && (
                  <>
                    <div className="mb-6 text-center text-3xl font-bold">
                      {aiJudgement.winner === "player" ? "Victory" : aiJudgement.winner === "opponent" ? "Defeat" : "Draw"}
                    </div>
                    
                    <div className="mb-6 space-y-4">
                      <div className="border-l-4 border-black bg-gray-50 p-4">
                        <div className="mb-2 text-xs font-bold uppercase text-gray-600">Your Performance</div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Argument Quality:</span>
                            <span className="font-bold">{aiJudgement.playerBreakdown.argumentQuality}/30</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Logic & Reasoning:</span>
                            <span className="font-bold">{aiJudgement.playerBreakdown.logicReasoning}/25</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Evidence & Facts:</span>
                            <span className="font-bold">{aiJudgement.playerBreakdown.evidenceFacts}/25</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Response Time:</span>
                            <span className="font-bold">{aiJudgement.playerBreakdown.responseTime}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Persuasiveness:</span>
                            <span className="font-bold">{aiJudgement.playerBreakdown.persuasiveness}/10</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-l-4 border-gray-400 bg-gray-50 p-4">
                        <div className="mb-2 text-xs font-bold uppercase text-gray-600">Opponent Performance</div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Argument Quality:</span>
                            <span className="font-bold">{aiJudgement.opponentBreakdown.argumentQuality}/30</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Logic & Reasoning:</span>
                            <span className="font-bold">{aiJudgement.opponentBreakdown.logicReasoning}/25</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Evidence & Facts:</span>
                            <span className="font-bold">{aiJudgement.opponentBreakdown.evidenceFacts}/25</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Response Time:</span>
                            <span className="font-bold">{aiJudgement.opponentBreakdown.responseTime}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Persuasiveness:</span>
                            <span className="font-bold">{aiJudgement.opponentBreakdown.persuasiveness}/10</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {!isJudging && !aiJudgement && (
                  <div className="mb-6 text-center text-3xl font-bold">
                    {yourScore > opponentScore ? "Victory" : yourScore < opponentScore ? "Defeat" : "Draw"}
                  </div>
                )}
                
                {!isJudging && (
                  <div className="text-center">
                    <Link
                      href="/lobby"
                      className="inline-block rounded-sm bg-black px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-gray-800"
                    >
                      Return to Lobby
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Debate Status */}
            {!debateEnded && (
              <div className="border border-gray-300 bg-white p-4">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-black">
                  Debate Status
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phase</span>
                    <span className="font-semibold text-black">
                      {isAnalyzing ? "Analysis" : isReadingBreak ? "Reading Break" : `Round ${round}/${totalRounds}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Turn</span>
                    <span className="font-semibold text-black">
                      {isAnalyzing ? "—" : isReadingBreak ? "Paused" : isYourTurn ? "You" : "Opponent"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mode</span>
                    <span className="font-semibold text-black">
                      {mode === "speed" ? "Speed (30s)" : "Standard (60s)"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DebatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-bold text-black mb-2">Loading debate...</div>
        <div className="text-gray-600">Please wait</div>
      </div>
    </div>}>
      <DebateRoom />
    </Suspense>
  );
}
