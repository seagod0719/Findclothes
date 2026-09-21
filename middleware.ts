import { NextResponse, type NextRequest } from "next/server";

// Temporary project pause. Revert this commit to restore the existing app.
// Return 503 on every public page and API request to disable image analysis and billing.
export function middleware(_request: NextRequest) {
  return new NextResponse(
    `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Findclothes — 일시 중지</title><style>*{box-sizing:border-box}body{min-height:100vh;margin:0;display:grid;place-items:center;background:#f6f5ef;color:#191b19;font-family:system-ui,-apple-system,"Malgun Gothic",sans-serif;text-align:center;padding:24px}main{max-width:540px}span{font-size:15px;letter-spacing:3px;font-weight:800}h1{font-size:clamp(30px,6vw,48px);letter-spacing:-1px;margin:32px 0 17px}p{font-size:16px;line-height:1.9;color:#555}b{color:#819c22}</style></head><body><main><span>findclothes<b>.</b></span><h1>서비스를 잠시 중지했습니다.</h1><p>서비스 점검 중입니다.<br>재개 시 다시 이용하실 수 있습니다.</p></main></body></html>`,
    {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
        "Retry-After": "86400",
        "X-Robots-Tag": "noindex, nofollow",
      },
    }
  );
}

// Include every route, including /api/analyze and /api/import-image.
// Keep the Next.js runtime assets available so deployment continues building normally.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
