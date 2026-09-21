import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const categories = ["상의", "하의", "아우터", "신발", "가방", "액세서리", "원피스", "기타"] as const;

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  error?: { message?: string; status?: string };
};

export async function POST(request: NextRequest) {
  try {
    const { image, locale = "ko" } = await request.json();
    const language = ({ ko: "한국어", en: "English", ja: "日本語", zh: "简体中文" } as Record<string, string>)[locale] || "한국어";
    if (typeof image !== "string" || image.length > 4_200_000) {
      return NextResponse.json({ error: "JPEG, PNG, WEBP 이미지(최대 3MB)를 업로드해 주세요." }, { status: 400 });
    }

    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(image);
    if (!match) {
      return NextResponse.json({ error: "JPEG, PNG, WEBP 이미지만 지원합니다." }, { status: 400 });
    }
    const mimeType = match[1];
    const bytes = Buffer.from(match[2], "base64");
    if (bytes.length === 0 || bytes.length > 3 * 1024 * 1024) {
      return NextResponse.json({ error: "이미지는 3MB 이하만 지원합니다." }, { status: 400 });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return NextResponse.json({
        error: "GEMINI_API_KEY가 설정되지 않았습니다. Vercel 환경변수 또는 .env.local을 확인해 주세요.",
        code: "CONFIG_MISSING",
      }, { status: 503 });
    }

    const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
    const instruction = `당신은 패션 이미지 분석기입니다. 사진에서 실제 보이는 의류와 패션 소품만 식별하세요. 얼굴, 사람의 신원, 유명인 여부를 추측하지 마세요. 확인되지 않은 브랜드나 특정 상품명을 만들어내지 마세요. name, color, details는 반드시 ${language}로 작성하고, query는 한국 쇼핑몰 검색에 적합한 한국어 검색어를 작성하세요. category는 아래의 한국어 카테고리 코드로 유지하세요. 반드시 아래 형태의 JSON만 출력하세요: {"items":[{"category":"상의","name":"블랙 오버핏 티셔츠","color":"블랙","details":"오버핏 면 소재","query":"블랙 오버핏 티셔츠"}]}. category는 다음 중 하나만 사용: ${categories.join(", ")}. 안 보이는 항목은 포함하지 말고 최대 8개만 반환하세요.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: instruction }] },
          contents: [{
            role: "user",
            parts: [
              { text: `사진 속 의상을 아이템별로 분석하세요. 상품명과 설명은 ${language}로 작성하고 쇼핑용 검색어만 한국어로 작성해 주세요.` },
              { inlineData: { mimeType, data: match[2] } },
            ],
          }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
            maxOutputTokens: 4096,
          },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(45000),
      }
    );

    if (!response.ok) {
      const failure = (await response.json().catch(() => ({}))) as GeminiResponse;
      console.error("Gemini analyze API failure", response.status, failure.error?.status);
      const message = response.status === 400 || response.status === 404
        ? "Gemini 모델을 찾을 수 없거나 요청이 올바르지 않습니다. GEMINI_MODEL 설정을 확인해 주세요."
        : response.status === 401 || response.status === 403
          ? "Gemini API 키 또는 프로젝트 권한을 확인해 주세요."
          : response.status === 429
            ? "Gemini API 요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요."
            : "Gemini 이미지 분석 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "").join("").trim();
    if (!text) {
      return NextResponse.json({ error: "사진에서 의상 분석 결과를 받지 못했습니다. 다른 사진으로 시도해 주세요." }, { status: 502 });
    }

    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || !("items" in parsed) || !Array.isArray(parsed.items)) {
      throw new Error("Invalid Gemini JSON response");
    }
    const items = parsed.items.slice(0, 8)
      .filter((item: unknown): item is Record<string, unknown> => {
        if (!item || typeof item !== "object") return false;
        const value = item as Record<string, unknown>;
        return typeof value.name === "string" && value.name.length > 0 && value.name.length <= 100 &&
          typeof value.query === "string" && value.query.length > 1 && value.query.length <= 100;
      })
      .map((item: Record<string, unknown>, index: number) => ({
        id: index + 1,
        category: categories.includes(item.category as typeof categories[number]) ? item.category : "기타",
        name: item.name,
        color: String(item.color ?? "").slice(0, 40),
        details: String(item.details ?? "").slice(0, 160),
        query: item.query,
      }));

    return NextResponse.json({ items, demo: false });
  } catch (error) {
    console.error("Image analysis failed:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "이미지 분석 중 오류가 발생했습니다. 다시 시도해 주세요." }, { status: 500 });
  }
}
