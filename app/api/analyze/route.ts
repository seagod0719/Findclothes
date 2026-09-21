import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const categories = ["상의", "하의", "아우터", "신발", "가방", "액세서리", "원피스", "기타"] as const;

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();
    if (typeof image !== "string" || image.length > 7_000_000 || !/^data:image\/(jpeg|png|webp);base64,/.test(image)) {
      return NextResponse.json({ error: "JPEG, PNG, WEBP 이미지(최대 4MB)를 업로드해 주세요." }, { status: 400 });
    }
    const payload = image.split(",")[1];
    const bytes = Buffer.from(payload, "base64");
    if (bytes.length === 0 || bytes.length > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "이미지는 4MB 이하만 지원합니다." }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY가 설정되지 않았습니다. .env.local을 설정하거나 데모 체험을 이용해 주세요.", code: "CONFIG_MISSING" }, { status: 503 });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 1100,
        messages: [
          { role: "system", content: `당신은 패션 이미지 분석기입니다. 이미지에서 실제 보이는 의류만 식별하세요. 얼굴, 사람 신원, 유명인 여부를 추측하지 마세요. 확인되지 않은 브랜드/상품명을 만들어내지 마세요. 한국어로 JSON만 출력하세요: {"items":[{"category":"상의","name":"블랙 오버핏 티셔츠","color":"블랙","details":"오버핏 면 소재","query":"블랙 오버핏 티셔츠"}]}. category는 다음 중 하나만: ${categories.join(", ")}. 이미지에 안 보이는 것은 포함하지 말고 최대 8개.` },
          { role: "user", content: [{ type: "text", text: "사진에 있는 의상을 아이템별로 분석하고 쇼핑 검색에 적합한 구체적 검색어를 만들어 주세요." }, { type: "image_url", image_url: { url: image, detail: "high" } }] }
        ],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(35000),
    });
    if (!response.ok) {
      return NextResponse.json({ error: "이미지 분석 서비스에 연결하지 못했습니다. API 키와 사용 한도를 확인해 주세요." }, { status: 502 });
    }
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (typeof text !== "string") throw new Error("Empty AI response");
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed.items)) throw new Error("Invalid AI response");
    const items = parsed.items.slice(0, 8).filter((item: Record<string, unknown>) =>
      item && typeof item.name === "string" && typeof item.query === "string" &&
      item.name.length <= 100 && item.query.length <= 100
    ).map((item: Record<string, string>, index: number) => ({
      id: index + 1, category: categories.includes(item.category as typeof categories[number]) ? item.category : "기타",
      name: item.name, color: String(item.color || "").slice(0, 40),
      details: String(item.details || "").slice(0, 160), query: item.query,
    }));
    return NextResponse.json({ items, demo: false });
  } catch {
    return NextResponse.json({ error: "이미지 분석 중 오류가 발생했습니다. 다시 시도해 주세요." }, { status: 500 });
  }
}
