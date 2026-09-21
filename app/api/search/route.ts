import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
type NaverProduct = { title: string; link: string; image: string; lprice: string; mallName: string; brand: string; productId: string };

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    if (typeof query !== "string" || query.trim().length < 2 || query.length > 100) {
      return NextResponse.json({ error: "올바른 상품 검색어를 입력해 주세요." }, { status: 400 });
    }
    if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
      return NextResponse.json({ error: "네이버 쇼핑 API 키가 설정되지 않았습니다. .env.local을 확인해 주세요.", code: "CONFIG_MISSING" }, { status: 503 });
    }
    const url = new URL("https://openapi.naver.com/v1/search/shop.json");
    url.searchParams.set("query", query.trim());
    url.searchParams.set("display", "30");
    url.searchParams.set("sort", "sim");
    const response = await fetch(url, {
      headers: { "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID, "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      return NextResponse.json({ error: "네이버 쇼핑 검색에 실패했습니다. API 인증 및 호출 한도를 확인해 주세요." }, { status: 502 });
    }
    const data = await response.json();
    const items = ((data.items || []) as NaverProduct[]).flatMap((item) => {
      try {
        const link = new URL(item.link);
        const image = new URL(item.image);
        if (link.protocol !== "https:" || image.protocol !== "https:") return [];
        return [{
          id: item.productId || item.link,
          title: String(item.title || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
          link: link.toString(), image: image.toString(),
          price: Number(item.lprice) || 0,
          mall: item.mallName || "쇼핑몰", brand: item.brand || "",
        }];
      } catch { return []; }
    });
    return NextResponse.json({ items, total: data.total || 0, source: "NAVER_SHOPPING", note: "검색어 관련도순 결과이며 사진과의 시각적 일치 또는 동일 제품 여부를 보장하지 않습니다." });
  } catch {
    return NextResponse.json({ error: "상품 검색 중 오류가 발생했습니다." }, { status: 500 });
  }
}
