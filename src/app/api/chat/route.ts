import { NextResponse } from "next/server";
import { respondToChat } from "@/lib/chat/respond";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { chatRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "local";
  const limited = rateLimit(`chat:${ip}`, LIMITS.chat);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "You're sending messages quickly. Please wait a few seconds and try again." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The message couldn't be read." }, { status: 400 });
  }
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Messages must be between 1 and 1000 characters." },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await respondToChat(parsed.data));
  } catch (error) {
    console.error("Chat failed", error);
    return NextResponse.json(
      { error: "Something went wrong on our side. Please try again." },
      { status: 500 },
    );
  }
}
