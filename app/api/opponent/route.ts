import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { topic, description, opponentSide, playerArguments, opponentArguments, turnNumber } = await request.json();

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === '') {
      console.error("OpenAI API key not configured");
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Build context of the debate so far
    const debateHistory = [];
    const maxHistory = Math.min(playerArguments.length, opponentArguments.length);
    for (let i = 0; i < maxHistory; i++) {
      if (playerArguments[i]) {
        debateHistory.push(`Player: ${playerArguments[i].text}`);
      }
      if (opponentArguments[i]) {
        debateHistory.push(`You (previously): ${opponentArguments[i].text}`);
      }
    }
    // Add latest player argument if exists
    if (playerArguments.length > maxHistory) {
      debateHistory.push(`Player: ${playerArguments[playerArguments.length - 1].text}`);
    }

    const prompt = `You are a skilled debater in a competitive debate. You must argue ${opponentSide.toUpperCase()} the following resolution.

RESOLUTION: ${topic}
CONTEXT: ${description}

YOUR POSITION: You are arguing ${opponentSide.toUpperCase()}

DEBATE SO FAR:
${debateHistory.length > 0 ? debateHistory.join('\n\n') : 'This is the opening statement.'}

INSTRUCTIONS:
- Make a strong, substantive argument for the ${opponentSide.toUpperCase()} position
- Use logical reasoning, evidence, and examples
- If responding to the player, directly address their points
- Be persuasive and sophisticated in your argumentation
- Keep response to 2-4 sentences (concise but impactful)
- Use debate terminology and structure when appropriate
- Cite relevant facts, studies, or examples when possible

Generate your next argument:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert competitive debater. You make strong, logical arguments backed by reasoning and evidence. You directly engage with opponent's points. Be persuasive, concise, and sophisticated.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 250,
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    return NextResponse.json({ argument: responseText.trim() });
  } catch (error) {
    console.error("Error generating opponent response:", error);
    return NextResponse.json(
      { error: "Failed to generate opponent response" },
      { status: 500 }
    );
  }
}
