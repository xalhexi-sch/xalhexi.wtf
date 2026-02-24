import { streamText } from "ai";
import { google } from "@ai-sdk/google";

export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    tutorialTitle,
    tutorialDescription,
    currentStepTitle,
    currentStepContent,
    mode,
  }: {
    messages: { role: "user" | "assistant"; content: string }[];
    tutorialTitle?: string;
    tutorialDescription?: string;
    currentStepTitle?: string;
    currentStepContent?: string;
    mode?: "chat" | "debug" | "explain";
  } = await req.json();

  // Build chat history summary from previous messages for context
  const recentHistory = messages.slice(-10).map((m: { role: string; content: string }) =>
    `${m.role}: ${m.content.substring(0, 200)}`
  ).join("\n");

  let systemPrompt = `You are xalhexi AI. You answer ANY question - IT, code, math, general knowledge, anything.

RULES:
- Be direct. Code first, explanation second.
- Short answers. No filler. No "Great question!" or "Sure, I'd be happy to help!"
- When giving code fixes: show the fix immediately, then 1-2 lines explaining why.
- Use code blocks with language tags for ALL code/commands.
- You can read the full chat history below to understand context and past errors.
- If someone had an error before, reference your past fix and build on it.
- Always give working, copy-paste ready solutions.

CHAT HISTORY (use this for context):
${recentHistory}`;

  if (tutorialTitle) {
    systemPrompt += `\n\nTUTORIAL CONTEXT (optional, user may or may not be asking about this):`;
    systemPrompt += `\nTutorial: "${tutorialTitle}"`;
    if (tutorialDescription) systemPrompt += ` - ${tutorialDescription}`;
    if (currentStepTitle) systemPrompt += `\nStep: "${currentStepTitle}"`;
    if (currentStepContent) systemPrompt += `\nContent:\n${currentStepContent}`;
  }

  if (mode === "debug") {
    systemPrompt += `\n\nMODE: DEBUG - User is pasting an error.
1. One-line: what the error is
2. The fix (code block, copy-paste ready)
3. One line: why it happened`;
  } else if (mode === "explain") {
    systemPrompt += `\n\nMODE: EXPLAIN - Break down the code/concept briefly. Line by line if code.`;
  }

  try {
    const result = streamText({
      model: google("gemini-2.0-flash"),
      system: systemPrompt,
      messages,
      abortSignal: req.signal,
    });

    return result.toTextStreamResponse();
  } catch (error: unknown) {
    console.error("[v0] Chat API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(message, { status: 500 });
  }
}

// Also catch unhandled rejections at module level for import issues
export const dynamic = "force-dynamic";
