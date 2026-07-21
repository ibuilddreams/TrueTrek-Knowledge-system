import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

let aiClient = null;

function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn(
        "WARNING: GEMINI_API_KEY environment variable is not set. Advisor features may fail."
      );
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { scenario, systemPrompt, advisorName } = body;

    if (!scenario || !systemPrompt) {
      return NextResponse.json(
        { error: "Missing scenario or systemPrompt parameters." },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        advice: `### [Offline Mode] System Notification\n\nIt looks like the **GEMINI_API_KEY** is not configured yet. Under normal conditions, I (${advisorName || "your advisor"}) would analyze your query with high intelligence.\n\n**Here is my offline assessment:**\n\n1. Always draft a clear, redlined counter-proposal addressing limits on restrictive covenants.\n2. Do not rush to accept capital or sponsorships that hyper-dilute your equity or violate collegiate compliance frameworks.\n3. Protect your schedule fiercely as physical recovery aligns directly with cognitive stamina.\n\n*Configure your GEMINI_API_KEY in a \`.env.local\` file to activate the live strategic response module!*`,
      });
    }

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: scenario,
      config: {
        systemInstruction: `${systemPrompt}\nAlways format your responses inside beautiful, highly professional Markdown with headings, bold takeaways, and actionable bullet points. Avoid clinical jargon and be incredibly precise.`,
        temperature: 0.75,
      },
    });

    return NextResponse.json({ advice: response.text });
  } catch (error) {
    console.error("Advisor generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate strategic advice.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
