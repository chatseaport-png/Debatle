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

    const prompt = `You are a professional debate judge with expertise in competitive debate formats. Your role is to provide fair, rigorous evaluation based on established debate criteria.

DEBATE TOPIC: ${topic}
RESOLUTION: ${description}

PLAYER POSITION (arguing ${playerSide.toUpperCase()}):
${playerArguments.map((arg: any, i: number) => `Argument ${i + 1}: ${arg.text}`).join('\n\n')}

OPPONENT POSITION (arguing ${playerSide === 'for' ? 'AGAINST' : 'FOR'}):
${opponentArguments.map((arg: any, i: number) => `Argument ${i + 1}: ${arg.text}`).join('\n\n')}

EVALUATION CRITERIA:

1. ARGUMENT QUALITY (0-30 points)
   - Strength and relevance of claims
   - Direct engagement with the resolution
   - Depth of analysis

2. LOGIC & REASONING (0-25 points)
   - Coherence of argumentation
   - Logical consistency
   - Valid inference and reasoning chains

3. EVIDENCE & SUPPORT (0-25 points)
   - Use of facts, examples, or reasoning
   - Credibility and relevance of support
   - Quality over quantity

4. REBUTTAL & CLASH (0-10 points)
   - Direct engagement with opponent's points
   - Effective refutation

5. PERSUASIVENESS & IMPACT (0-10 points)
   - Overall convincing power
   - Clarity and communication

BE CRITICAL and THOROUGH. Do not award high scores unless truly earned. Look for logical fallacies, weak evidence, and poor argumentation. A score of 70+ should indicate excellent debate performance.

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
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a highly critical professional debate judge with years of experience in competitive debate. You have high standards and only award high scores for truly excellent argumentation. Respond only with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
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
