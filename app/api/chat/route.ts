import { streamText } from "ai";

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

  let systemPrompt = `You are an IT/Linux tutorial assistant for university students learning IT fundamentals (Git, SSH, Linux, networking, etc.).

CURRENT CONTEXT:`;

  if (tutorialTitle) {
    systemPrompt += `\nTutorial: "${tutorialTitle}"`;
    if (tutorialDescription) systemPrompt += ` - ${tutorialDescription}`;
  }
  if (currentStepTitle) {
    systemPrompt += `\nCurrent step: "${currentStepTitle}"`;
  }
  if (currentStepContent) {
    systemPrompt += `\nStep content:\n${currentStepContent}`;
  }

  if (mode === "debug") {
    systemPrompt += `\n\nMODE: DEBUG
The student is pasting an error or problem. You MUST:
1. Identify the error in a short summary line
2. Explain the CAUSE clearly (1-2 sentences)
3. Provide the FIX with exact commands they can copy-paste
4. If relevant, explain how to prevent it next time

Format your response with clear sections. Use code blocks with language tags for all commands.`;
  } else if (mode === "explain") {
    systemPrompt += `\n\nMODE: EXPLAIN CODE
The student wants a code/command explanation. You MUST:
1. Give a one-line summary of what the code does
2. Break it down line by line or part by part
3. Explain each key part in simple terms
4. Give a real-world analogy if helpful

Keep it beginner-friendly. Use code blocks with language tags.`;
  } else {
    systemPrompt += `\n\nMODE: Q&A
Answer the student's question based on the tutorial context above.

Rules:
- Keep answers concise and practical (students are beginners)
- Use code blocks with language tags for ALL commands and code
- If they ask something outside this tutorial, still help but note it
- Suggest next steps or related concepts when appropriate
- Never show API keys, tokens, or sensitive data in examples`;
  }

  const result = streamText({
    model: "openai/gpt-4o-mini",
    system: systemPrompt,
    messages,
    abortSignal: req.signal,
  });

  return result.toDataStreamResponse();
}
