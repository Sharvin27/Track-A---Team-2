import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `You are a helpful assistant for Lemontree Volunteer Hub, a web platform (not a mobile app) that helps volunteers distribute food resource flyers in their community.

About Lemontree:
- Volunteers download print-ready flyers from foodhelpline.org/share (English and Spanish)
- They find nearby print shops using the Nearby Printers tab, which shows live distances, open hours, and per-page rates
- They distribute flyers in their neighborhoods and log activity on the Outreach Coverage Map
- The platform tracks contributions, has a leaderboard, and lets volunteers export a PDF certificate of hours

Print shop rates (publicly listed):
- Staples: $0.09/page B&W · $0.49/page Color
- FedEx Office: $0.12/page B&W · $0.55/page Color
- UPS Store: $0.14/page B&W · $0.79/page Color
- Office Depot: $0.09/page B&W · $0.45/page Color

Pages:
- GET_STARTED — 4-step guide to begin volunteering
- GUIDE — Volunteer Guide: detailed flyering tips and instructions
- PRINTERS — Nearby Printers: find and sort real print shops by location
- MAP — Outreach Coverage Map: log covered locations and see what needs flyering
- LEADERBOARD — Rankings by flyers distributed, resets monthly. This feature EXISTS and is live.
- PROFILE — Personal stats and volunteer certificate export
- FLYERS — Download print-ready flyers from foodhelpline.org/share

Flyering tips:
- Good spots: laundromats, cafes, libraries, church lobbies, community boards, barbershops
- Always ask permission on private property; public sidewalks are free
- Never put flyers in mailboxes (federal offense)
- A good opening: "Hi, I'm volunteering with Lemontree. Here's a flyer about free food in the neighborhood."
- 50–100 copies is a good starting amount for a 1–2 hour session

Be helpful, warm, and concise. Keep responses to 1-2 sentences maximum. Never mention URL paths in your response. Never say a feature doesn't exist — all pages listed above are real and live.

IMPORTANT: If your response is directing the user to a specific page or action, end your response with [LINK:PAGE_NAME] using one of the page names above (GET_STARTED, GUIDE, PRINTERS, MAP, LEADERBOARD, PROFILE, FLYERS). Only include a link tag when it's directly relevant to what the user needs to do next. Do not include a link tag for general questions.`;

const LINK_MAP: Record<string, { label: string; href: string }> = {
  GET_STARTED: { label: "Get Started", href: "/onboarding" },
  GUIDE: { label: "Read the Guide", href: "/guide" },
  PRINTERS: { label: "Find Printers", href: "/printers" },
  MAP: { label: "Open the Map", href: "/map" },
  LEADERBOARD: { label: "View Leaderboard", href: "/leaderboard" },
  PROFILE: { label: "Go to Profile", href: "/profile" },
  FLYERS: { label: "Download Flyers", href: "https://foodhelpline.org/share" },
};

export async function POST(request: Request) {
  const { messages } = await request.json();

  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite-preview",
    systemInstruction: SYSTEM_PROMPT,
  });

  const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];
  const chat = model.startChat({ history });
  const result = await chat.sendMessageStream(lastMessage.content);

  const encoder = new TextEncoder();
  let buffer = "";

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          buffer += chunk.text();
        }

        // Extract link tag if present
        const linkMatch = buffer.match(/\[LINK:([A-Z_]+)\]/);
        const linkKey = linkMatch?.[1];
        const link = linkKey ? LINK_MAP[linkKey] : undefined;

        // Strip markdown and link tag from text
        const text = buffer
          .replace(/\[LINK:[A-Z_]+\]/g, "")
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .replace(/\*(.*?)\*/g, "$1")
          .replace(/`(.*?)`/g, "$1")
          .trim();

        // Send text first, then link as a JSON suffix
        controller.enqueue(encoder.encode(text));
        if (link) {
          controller.enqueue(encoder.encode(`\n\n__LINK__${JSON.stringify(link)}`));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
