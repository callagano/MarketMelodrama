import { NextRequest, NextResponse } from 'next/server';

interface TranslateRequestBody {
  texts: string[];
  targetLang: 'EN' | 'IT';
  sourceLang?: 'EN' | 'IT';
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'DEEPL_API_KEY is not set' },
        { status: 500 }
      );
    }

    const body = (await req.json()) as TranslateRequestBody;
    const { texts, targetLang, sourceLang } = body || {};

    if (!Array.isArray(texts) || texts.length === 0 || !targetLang) {
      return NextResponse.json(
        { success: false, message: 'Invalid payload: provide texts[] and targetLang' },
        { status: 400 }
      );
    }

    // Build form data for DeepL API
    const form = new URLSearchParams();
    for (const t of texts) {
      form.append('text', t);
    }
    form.append('target_lang', targetLang);
    if (sourceLang) form.append('source_lang', sourceLang);

    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: form.toString()
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { success: false, message: 'DeepL error', error: errText },
        { status: response.status }
      );
    }

    const json = await response.json();
    // DeepL returns { translations: [{ detected_source_language, text }, ...] }
    const translations: string[] = (json?.translations || []).map((t: any) => t.text);

    return NextResponse.json({ success: true, translations });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to translate', error: (error as Error).message },
      { status: 500 }
    );
  }
}



