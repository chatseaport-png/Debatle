# AI System in DEBATEL

## What AI Does (and Doesn't Do)

### ✅ AI IS the Judge
- **After each debate**, the AI judge analyzes both players' arguments
- Uses **OpenAI GPT-4** to evaluate argument quality, logic, evidence, response time, and persuasiveness
- Provides detailed scoring breakdown (100 points total)
- Gives reasoning for the decision

### ❌ AI is NOT Your Opponent
- DEBATEL is **multiplayer-only**
- You ONLY debate against real people online
- There is no AI bot to practice against
- Both players must be human

## How the AI Judge Works

### Scoring Criteria (100 points total):
1. **Argument Quality** (30 points) - Strength and relevance
2. **Logic & Reasoning** (25 points) - Coherence and consistency
3. **Evidence & Facts** (25 points) - Use of credible support
4. **Response Time** (10 points) - Quick thinking efficiency
5. **Persuasiveness** (10 points) - Overall convincing power

### Technical Implementation:
- Location: `app/api/judge/route.ts`
- Model: GPT-4 (via OpenAI API)
- Input: Full transcript from both debaters + topic context
- Output: JSON with scores, breakdown, winner, and reasoning

## Setup Requirements

### 1. Get an OpenAI API Key
- Go to: https://platform.openai.com/api-keys
- Sign up/log in to your OpenAI account
- Click "Create new secret key"
- Copy the key (starts with `sk-proj-` or `sk-`)
- **Important:** You need billing set up and credits in your OpenAI account

### 2. Add to Your Project
```bash
# Create .env.local file (if cloned from GitHub)
touch .env.local

# Open in text editor and add:
OPENAI_API_KEY=sk-proj-your-actual-key-here
```

### 3. Restart Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

## Verifying AI Judge Works

### In the Terminal:
When a debate ends, you should see:
```
Judging debate with AI...
Player arguments: 5
Opponent arguments: 5
```

### In the Debate:
- At the end, you'll see an "AI Judge" message
- Shows final scores: "You: X | Opponent: Y"
- Includes detailed reasoning for the decision
- If API fails, falls back to simple score comparison (no reasoning)

## Common Issues

### "AI judge not working"
1. **Missing .env.local** - Most common when cloning from GitHub
2. **Invalid API key** - Check it starts with `sk-proj-` or `sk-`
3. **No OpenAI credits** - Check your billing at platform.openai.com
4. **Server not restarted** - Must restart after adding/changing API key

### "Scores seem inaccurate"
- The AI IS analyzing your actual arguments (not random)
- GPT-4 evaluates based on debate quality, not length
- Strong arguments > long arguments
- Check terminal for "Judging debate with AI..." to confirm API is being called
- If no API message appears, check your .env.local file

### "Getting fallback scores without reasoning"
This means the API call failed:
- Check terminal for error messages
- Verify API key is correct in .env.local
- Check OpenAI account has credits/billing enabled
- Test API key: https://platform.openai.com/playground

## Cost Estimates

- GPT-4 pricing: ~$0.01-0.03 per debate judgment
- Each debate sends ~500-1500 tokens
- 100 debates ≈ $1-3 in API costs
- Set billing limits in OpenAI dashboard to control costs

## Alternative Models

Want to use a different model? Edit `app/api/judge/route.ts`:

```typescript
// Line 67 - Change model:
const completion = await openai.chat.completions.create({
  model: "gpt-4",  // Change to: "gpt-4-turbo" or "gpt-3.5-turbo"
  messages: [...]
});
```

**Model options:**
- `gpt-4` - Most accurate, higher cost
- `gpt-4-turbo` - Faster, slightly cheaper
- `gpt-3.5-turbo` - Cheapest, less sophisticated analysis

## Testing Without AI

If you want to test debates without using OpenAI credits:

1. Comment out the API call in `app/api/judge/route.ts`
2. Return mock scores in the catch block
3. The app will use simple score comparison as fallback

Or just let small tests fail - the fallback scoring still determines a winner based on accumulated points during the debate.
