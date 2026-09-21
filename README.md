# Findclothes

사진에서 의상을 분석하고 비슷한 스타일을 쇼핑몰에서 찾아볼 수 있는 Next.js 웹앱입니다.

## 현재 구현

- JPEG/PNG/WEBP 업로드 및 미리보기 (최대 3MB), 드래그 앤 드롭
- Gemini 비전 API를 통한 이미지 속 의류 개별 인식·검색어 생성
- 원하는 의류 선택 후 **네이버 쇼핑 / 무신사 / Google 쇼핑 검색 결과로 이동**
- 샘플 의상 선택 데모 (실제 이미지 AI 분석 결과가 아님), 모바일 대응

**중요:** NAVER Developers의 기존 **쇼핑 검색 API는 2026-07-31 종료**됐으며 NAVER API HUB로 이관되지 않았습니다. 따라서 상품 사진·상품 가격·상품 개별 링크를 Findclothes 내부에 불러오거나 정확한 동일 제품을 확정하는 기능은 현재 제공하지 않습니다. 옛 API를 호출하는 이전 버전 코드는 사용하지 마세요.

공식 공지:
- https://developers.naver.com/notice/article/32564
- https://developers.naver.com/notice/article/32530

## 시작하기

Node.js 22 권장. 프로젝트 디렉터리에서:

```bash
npm install
npm run dev
```

실제 AI 분석을 사용하려면 `.env.example`을 `.env.local`로 복사한 뒤 다음을 입력하세요.

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.6-flash
```

Windows PowerShell: `Copy-Item .env.example .env.local`

브라우저: http://localhost:3000

Gemini 키 없이도 "먼저 체험해보기"로 데모 의상 선택 및 쇼핑몰 검색 이동 흐름을 테스트할 수 있습니다. 쇼핑몰 검색 결과 링크에는 API 키가 필요하지 않습니다.

## 실제 상품 카드 구현에 필요한 것

이미지·상품명·가격·상품별 판매처를 서비스 내부에 표시하려면 **별도의 사용 허가된 상품 카탈로그 API / 제휴 데이터 피드**가 필요합니다. 데이터 공급자의 사용 약관을 검토하고 상품 목록을 연동한 뒤 시각적 유사도 재정렬 기능을 추가해야 합니다. 네이버 커머스 API는 일반적인 네이버 쇼핑 전체 상품 공개 검색 API의 단순 대체제가 아닙니다.

## 배포

Vercel 또는 Next.js를 지원하는 서버에서 `GEMINI_API_KEY` 서버 환경변수를 지정하세요. API 키를 GitHub에 올리지 마세요. 이미지 자체는 Findclothes DB에 저장하지 않지만 의상 분석 시 Google Gemini API에 전송합니다. 해당 모델의 접근 권한 및 지원 여부는 Google AI Studio에서 확인하세요. 공개 운영 전 업로드 동의·보관정책 및 요청량 제한을 마련하세요.


## Vercel 배포

1. [Vercel Dashboard](https://vercel.com/new)에서 **Add New → Project**를 선택합니다.
2. GitHub에 연결해 `seagod0719/Findclothes`를 Import합니다.
3. Framework Preset: **Next.js** / Root Directory: **./** / Build Command: 기본값(`next build`) / Output Directory: 기본값을 사용합니다.
4. Project Settings → Environment Variables에서 `GEMINI_API_KEY`를 **Production, Preview, Development** 중 사용할 환경에 설정합니다. 필요하면 `GEMINI_MODEL=gemini-3.6-flash`을 추가합니다.
5. **Deploy**를 누릅니다. API 키는 브라우저 코드에 쓰지 말고 서버 환경변수로만 설정하세요.
6. 환경변수를 배포 후 추가했다면 **Redeploy**해야 새 배포에 적용됩니다.

네이버 쇼핑 검색 링크·무신사·Google 쇼핑 링크 사용에는 NAVER_CLIENT_ID/NAVER_CLIENT_SECRET이 필요하지 않습니다. `.env.local`은 로컬 개발 전용이며 GitHub에 올라가지 않습니다.

**주의:** Vercel 요청 본문 크기 한도를 고려하여 사진 파일을 최대 3MB로 제한했습니다. 프리 티어 등의 실행 시간 설정에 따라 AI API 응답이 지연되거나 타임아웃될 수 있습니다. 공개 배포 전에는 API 호출 남용 방지와 사용량 제한을 추가하세요.


## 다국어 및 외부 웹 이미지 업로드

- 우측 상단 지구본 버튼에서 한국어 / English / 日本語 / 简体中文을 선택합니다. 선택한 언어는 브라우저에 저장됩니다.
- Gemini 의상명·설명은 분석 시 선택한 언어로 생성합니다. 국내 쇼핑몰 검색어는 한국어로 유지합니다. 이미 분석된 결과는 재분석 전까지 원래 언어로 표시될 수 있습니다.
- 사진 선택 버튼 또는 페이지 어디에나 JPG/PNG/WEBP 이미지 파일을 드롭할 수 있습니다.
- 다른 HTTPS 웹사이트에서 이미지 자체를 드래그하면 브라우저가 제공하는 이미지 파일 또는 이미지 URL을 가져옵니다. 사진 주소만 전달되면 `/api/import-image`에서 HTTPS 주소·공인 IP·파일 유형·최대 3MB를 검사하고 이미지를 받아옵니다. 로그인이 필요하거나 핫링크를 차단하는 사이트는 가져올 수 없으므로 사진을 저장해 업로드하세요.
- 외부 URL에서 이미지를 가져올 때 공개 사용 전에는 별도 요청 제한/남용 방지 기능을 권장합니다.
