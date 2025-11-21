"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getRandomPrompt } from "@/lib/debatePrompts";
import { useSocket } from "@/lib/socket";

export default function DebateRoom() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode") || "standard";
  const userSide = searchParams.get("side") || "for";
  const matchId = searchParams.get("matchId");
  const isMultiplayer = searchParams.get("multiplayer") === "true";
  const goesFirst = searchParams.get("goesFirst") === "true";
  const timePerTurn = mode === "speed" ? 30 : 60;
  const totalRounds = 5;

  const { socket } = useSocket();
  const [prompt] = useState(() => getRandomPrompt());
  const [position] = useState<"for" | "against">(() => 
    userSide as "for" | "against"
  );
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [messages, setMessages] = useState<Array<{ 
    sender: string; 
    text: string; 
    time: number;
    isYourTurn: boolean;
  }>>([
    { 
      sender: "Moderator", 
      text: `Resolution assigned. You have 60 seconds to analyze the topic before the debate begins.`, 
      time: 0,
      isYourTurn: false
    },
  ]);
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
    if (debateEnded) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (isAnalyzing) {
            // Analysis period ended, start debate
            setIsAnalyzing(false);
            setRound(1);
            setIsYourTurn(position === "for");
            const startMsg = {
              sender: "Moderator",
              text: `Analysis complete. Debate begins. ${position === "for" ? "You open" : "Opponent opens"}.`,
              time: 0,
              isYourTurn: false
            };
            setMessages(prev => [...prev, startMsg]);
            
            if (position === "against") {
              // Opponent goes first
              setTimeout(() => generateOpponentResponse(), 2000);
            }
            return timePerTurn;
          } else if (isYourTurn && !hasSubmitted) {
            // Time's up during debate - auto-submit or skip turn
            handleTimeUp();
          }
          return timePerTurn;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isYourTurn, hasSubmitted, debateEnded, timePerTurn, isAnalyzing, position]);

  const handleTimeUp = () => {
    if (!hasSubmitted) {
      const penaltyMsg = {
        sender: "Moderator",
        text: "Time expired. No argument submitted. Points deducted.",
        time: 0,
        isYourTurn: false
      };
      setMessages(prev => [...prev, penaltyMsg]);
      setYourScore(Math.max(0, yourScore - 10));
    }
    switchTurns();
  };

  const switchTurns = () => {
    setHasSubmitted(false);
    setIsYourTurn(!isYourTurn);
    setTimeLeft(timePerTurn);
    
    if (!isYourTurn) {
      // It will be opponent's turn, simulate their response
      setTimeout(() => {
        generateOpponentResponse();
      }, 2000);
    }
    
    const newRound = Math.ceil((messages.filter(m => m.sender !== "Moderator").length + 1) / 2);
    setRound(newRound);
    
    if (newRound > totalRounds) {
      endDebate();
    }
  };

  const generateOpponentResponse = () => {
    const opponentMessages = [
      "The empirical evidence contradicts this position. Studies from peer-reviewed journals demonstrate that federal oversight has consistently produced superior outcomes in environmental policy coordination.",
      "Your argument fails to address the constitutional framework. The Commerce Clause explicitly grants Congress authority over interstate matters, which environmental issues inherently are.",
      "I must respectfully disagree. The data from the past three decades shows that state-level initiatives have been undermined by lack of coordination and regulatory arbitrage.",
      "This perspective overlooks the economic externalities. Without federal standards, we create a race to the bottom where states compete by lowering environmental protections.",
      "Historical precedent contradicts your position. The Clean Air Act and Clean Water Act demonstrate the effectiveness of federal environmental regulation.",
      "Your reasoning ignores the tragedy of the commons. Interstate pollution requires interstate solutions, which only federal policy can provide.",
    ];
    
    const opponentMsg = {
      sender: "Opponent",
      text: opponentMessages[Math.floor(Math.random() * opponentMessages.length)],
      time: Math.floor(Math.random() * 15) + 10,
      isYourTurn: false
    };
    
    setMessages(prev => [...prev, opponentMsg]);
    const opponentPoints = Math.floor(Math.random() * 25) + 20;
    setOpponentScore(prev => prev + opponentPoints);
    
    setTimeout(() => {
      setIsYourTurn(true);
      setTimeLeft(timePerTurn);
    }, 1000);
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
    
    setTimeout(() => {
      if (!isMultiplayer) {
        switchTurns();
      }
    }, 1500);
  };

  const endDebate = async () => {
    setDebateEnded(true);
    setIsJudging(true);
    
    // Notify server if multiplayer
    if (isMultiplayer && socket && matchId) {
      socket.emit("end-debate", { matchId });
    }
    
    const finalMsg = {
      sender: "Moderator",
      text: `Debate concluded. AI is analyzing arguments...`,
      time: 0,
      isYourTurn: false
    };
    setMessages(prev => [...prev, finalMsg]);

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
                {isAnalyzing ? "Analyzing Topic" : `Round ${round}/${totalRounds}`} • {mode === "speed" ? "Speed" : "Standard"}
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
                <span className="border-l-4 border-black bg-black px-3 py-2 text-xl font-bold text-white">
                  YOU: {position.toUpperCase()}
                </span>
                <span className="text-gray-400">vs</span>
                <span className="border-l-4 border-gray-400 bg-gray-200 px-3 py-2 text-xl font-bold text-gray-700">
                  OPPONENT: {position === "for" ? "AGAINST" : "FOR"}
                </span>
              </div>
            </div>

            {/* Turn Indicator */}
            {!debateEnded && !isAnalyzing && (
              <div className={`mb-4 border-l-2 p-3 ${
                isYourTurn ? "border-black bg-blue-50" : "border-gray-400 bg-gray-50"
              }`}>
                <div className="text-xs font-bold uppercase tracking-wide">
                  {isYourTurn ? "Your Turn" : "Opponent's Turn"}
                </div>
              </div>
            )}
            
            {isAnalyzing && (
              <div className="mb-4 border-l-2 border-blue-600 bg-blue-50 p-3">
                <div className="text-xs font-bold uppercase tracking-wide text-blue-900">
                  Analyzing Topic - Prepare Your Arguments
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
                    {msg.time > 0 && (
                      <div className="mt-1 text-xs text-gray-500">{msg.time}s</div>
                    )}
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
                    if (e.key === "Enter" && !e.shiftKey && isYourTurn && !hasSubmitted && !isAnalyzing) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={isAnalyzing ? "Analyzing topic..." : isYourTurn ? "Enter argument... (Enter to submit)" : "Waiting..."}
                  disabled={!isYourTurn || hasSubmitted || isAnalyzing}
                  className="w-full resize-none border border-gray-200 p-3 text-sm text-black placeholder-gray-400 focus:border-black focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                  rows={3}
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={sendMessage}
                    disabled={!isYourTurn || hasSubmitted || !currentMessage.trim() || isAnalyzing}
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
            {/* Scores */}
            <div className="border border-gray-300 bg-white p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-black">
                Scores
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-semibold text-black">You</span>
                    <span className="font-bold text-black">{yourScore}</span>
                  </div>
                  <div className="h-1.5 bg-gray-200">
                    <div
                      className="h-full bg-black transition-all"
                      style={{ width: `${(yourScore / (yourScore + opponentScore)) * 100 || 50}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-semibold text-gray-700">Opponent</span>
                    <span className="font-bold text-gray-700">{opponentScore}</span>
                  </div>
                  <div className="h-1.5 bg-gray-200">
                    <div
                      className="h-full bg-gray-600 transition-all"
                      style={{ width: `${(opponentScore / (yourScore + opponentScore)) * 100 || 50}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Evaluation */}
            <div className="border border-gray-300 bg-white p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-black">
                AI Analysis
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Response</span>
                  <span className="font-semibold text-black">Good</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Clarity</span>
                  <span className="font-semibold text-black">Strong</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Relevance</span>
                  <span className="font-semibold text-black">On-Topic</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
