import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request) {
  try {
    const { text, lang } = await request.json();
    if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });

    // Voice selection — warm, human-sounding voices
    // shimmer: warm female, natural pauses, conversational — best "friend" voice
    // nova:    energetic, clear — good for Hindi
    const voice = lang === "hi" ? "nova" : "shimmer";

    const clean = text
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .replace(/[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
      .replace(/\n+/g, ". ")
      .replace(/\.\s*\./g, ".")   // collapse double periods
      .replace(/,\s*,/g, ",")     // collapse double commas
      .trim()
      .slice(0, 4096);

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",        // tts-1 for speed, tts-1-hd for maximum quality
      voice,
      input: clean,
      speed: 0.95,            // Slightly slower = more natural, human pacing
      response_format: "mp3",
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    return new Response(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
