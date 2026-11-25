import { NextRequest, NextResponse } from 'next/server';
import { resolveGeminiConfig } from '@/lib/geminiEngine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { apiKey?: string };
  const { apiKey, model } = resolveGeminiConfig(body.apiKey);

  if (!apiKey) {
    return NextResponse.json({
      connected: false,
      model,
      error: 'No Gemini API key configured yet.',
    });
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Reply with {"ok":true}' }] }],
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 20 },
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({
        connected: false,
        model,
        error: `Gemini API returned ${res.status}: ${errText.slice(0, 140)}`,
      });
    }

    return NextResponse.json({ connected: true, model });
  } catch (err) {
    return NextResponse.json({
      connected: false,
      model,
      error: err instanceof Error ? err.message : 'Connection failed',
    });
  }
}
