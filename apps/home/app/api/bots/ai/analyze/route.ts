import { NextResponse } from 'next/server';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const PROMPT =
  'Analyze this market chart and predict if it shows an upward or downward trend. ' +
  'Identify the market type (e.g. Volatility 100, EUR/USD, etc) and timeframe if visible. ' +
  'Provide percentage confidence for both rise and fall scenarios. Give a detailed, ' +
  'humanly-written analysis. Start with the format: Market: [market type], ' +
  'Timeframe: [timeframe], Rise: X%, Fall: Y%. Then provide a comprehensive analysis paragraph.';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'Gemini key not configured' }, { status: 500 });
  }

  let body: { image?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const base64 = body.image?.split(',')[1];
  if (!base64) {
    return NextResponse.json({ error: 'Missing image' }, { status: 400 });
  }

  const payload = {
    contents: [{
      parts: [
        { text: PROMPT },
        { inline_data: { mime_type: 'image/jpeg', data: base64 } },
      ],
    }],
    generationConfig: { temperature: 0.7, topK: 32, topP: 1, maxOutputTokens: 20000 },
  };

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify(payload),
      });

      if (res.status === 503) {
        if (attempt === 3) {
          return NextResponse.json({ error: 'AI model overloaded, try again later' }, { status: 503 });
        }
        await sleep(Math.min(1000 * 2 ** attempt, 10000));
        continue;
      }
      if (!res.ok) {
        return NextResponse.json({ error: `Gemini error ${res.status}` }, { status: 502 });
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text !== 'string') {
        return NextResponse.json({ error: 'Invalid response from AI' }, { status: 502 });
      }
      return NextResponse.json({ text });
    } catch {
      if (attempt === 3) {
        return NextResponse.json({ error: 'Failed to reach AI service' }, { status: 502 });
      }
    }
  }
  return NextResponse.json({ error: 'AI request failed' }, { status: 502 });
}
