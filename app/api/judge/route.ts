import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { topic, description, playerArguments, opponentArguments, playerSide } = await request.json();

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === '') {
      console.error("OpenAI API key not configured");
      return NextResponse.json(
        { error: "OpenAI API key not configured. Please add OPENAI_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    console.log("Judging debate with AI...");
    console.log("Player arguments:", playerArguments.length);
    console.log("Opponent arguments:", opponentArguments.length);

    const prompt = `You are an expert debate judge. Evaluate the following debate and determine the winner based on argument quality, logic, evidence, and persuasiveness.

Topic: ${topic}
Question: ${description}

Player (arguing ${playerSide.toUpperCase()}):
${playerArguments.map((arg: any, i: number) => `${i + 1}. ${arg.text} (Response time: ${arg.time}s)`).join('\n')}

Opponent (arguing ${playerSide === 'for' ? 'AGAINST' : 'FOR'}):
${opponentArguments.map((arg: any, i: number) => `${i + 1}. ${arg.text} (Response time: ${arg.time}s)`).join('\n')}

Evaluate each debater on:
1. Argument Quality (0-30 points): Strength and relevance of arguments
2. Logic & Reasoning (0-25 points): Coherence and logical consistency
3. Evidence & Facts (0-25 points): Use of factual support and credible evidence
4. Response Time (0-10 points): Efficiency and quick thinking
5. Persuasiveness (0-10 points): Overall convincing power

Respond ONLY with a JSON object in this exact format:
{
  "playerScore": <number 0-100>,
  "opponentScore": <number 0-100>,
  "winner": "player" or "opponent" or "tie",
  "reasoning": "<brief explanation of decision>",
  "playerBreakdown": {
    "argumentQuality": <0-30>,
    "logicReasoning": <0-25>,
    "evidenceFacts": <0-25>,
    "responseTime": <0-10>,
    "persuasiveness": <0-10>
  },
  "opponentBreakdown": {
    "argumentQuality": <0-30>,
    "logicReasoning": <0-25>,
    "evidenceFacts": <0-25>,
    "responseTime": <0-10>,
    "persuasiveness": <0-10>
  }
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert debate judge. Respond only with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    const judgement = JSON.parse(responseText);

    return NextResponse.json(judgement);
  } catch (error) {
    console.error("Error judging debate:", error);
    return NextResponse.json(
      { error: "Failed to judge debate" },
      { status: 500 }
    );
  }
}
