import { NextRequest, NextResponse } from "next/server";

// Naver's legacy shopping-search API ended July 31, 2026.
// Do not call /v1/search/shop.json or claim to return live product cards.
export async function POST(request: NextRequest) {
  try {
    const { query, locale = "ko" } = await request.json();
    if (typeof query !== "string" || query.trim().length < 2 || query.length > 100) {
      return NextResponse.json({ error: "올바른 상품 검색어를 입력해 주세요." }, { status: 400 });
    }
    const encoded = encodeURIComponent(query.trim());
    const descriptions: Record<string, [string, string, string]> = {
      ko: ["다양한 국내 쇼핑몰의 상품을 검색합니다.", "패션 브랜드와 의류를 검색합니다.", "웹 전반의 쇼핑 상품을 검색합니다."],
      en: ["Find items from Korean online stores.", "Explore clothing and fashion brands.", "Search shopping results across the web."],
      ja: ["韓国のオンラインショップの商品を検索します。", "ファッションブランドや洋服を探します。", "ウェブ全体のショッピング商品を検索します。"],
      zh: ["搜索韩国各大购物网站的商品。", "探索服饰和时尚品牌。", "搜索全网购物商品。"],
    };
    const names: Record<string, [string, string, string]> = {
      ko: ["네이버 쇼핑", "무신사", "Google 쇼핑"],
      en: ["Naver Shopping", "MUSINSA", "Google Shopping"],
      ja: ["NAVERショッピング", "MUSINSA", "Googleショッピング"],
      zh: ["NAVER购物", "MUSINSA", "Google购物"],
    };
    const description = descriptions[locale as string] || descriptions.ko;
    const shopNames = names[locale as string] || names.ko;
    return NextResponse.json({
      items: [],
      links: [
        { name: shopNames[0], url: `https://search.shopping.naver.com/search/all?query=${encoded}`, description: description[0] },
        { name: shopNames[1], url: `https://www.musinsa.com/search/goods?keyword=${encoded}`, description: description[1] },
        { name: shopNames[2], url: `https://www.google.com/search?tbm=shop&q=${encoded}`, description: description[2] },
      ],
      source: "EXTERNAL_SHOP_SEARCH_LINKS",
      note: "각 쇼핑몰의 실제 검색 결과로 이동합니다. 상품 목록 및 가격 데이터는 반환하지 않습니다.",
    });
  } catch {
    return NextResponse.json({ error: "검색 링크 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
