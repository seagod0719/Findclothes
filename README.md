# Findclothes

사진에서 의상을 분석하고 비슷한 스타일을 쇼핑몰에서 찾아볼 수 있는 Next.js 웹앱입니다.

## 현재 구현

- JPEG/PNG/WEBP 업로드 및 미리보기 (최대 3MB), 드래그 앤 드롭
- OpenAI 비전 API를 통한 이미지 속 의류 개별 인식·검색어 생성
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
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-mini
```

Windows PowerShell: `Copy-Item .env.example .env.local`

브라우저: http://localhost:3000

OpenAI 키 없이도 "먼저 체험해보기"로 데모 의상 선택 및 쇼핑몰 검색 이동 흐름을 테스트할 수 있습니다. 쇼핑몰 검색 결과 링크에는 API 키가 필요하지 않습니다.

## 실제 상품 카드 구현에 필요한 것

이미지·상품명·가격·상품별 판매처를 서비스 내부에 표시하려면 **별도의 사용 허가된 상품 카탈로그 API / 제휴 데이터 피드**가 필요합니다. 데이터 공급자의 사용 약관을 검토하고 상품 목록을 연동한 뒤 시각적 유사도 재정렬 기능을 추가해야 합니다. 네이버 커머스 API는 일반적인 네이버 쇼핑 전체 상품 공개 검색 API의 단순 대체제가 아닙니다.

## 배포

Vercel 또는 Next.js를 지원하는 서버에서 `OPENAI_API_KEY` 서버 환경변수를 지정하세요. API 키를 GitHub에 올리지 마세요. 이미지 자체는 Findclothes DB에 저장하지 않지만 의상 분석 시 OpenAI에 전송합니다. 공개 운영 전 업로드 동의·보관정책 및 요청량 제한을 마련하세요.


## Vercel 배포

1. [Vercel Dashboard](https://vercel.com/new)에서 **Add New → Project**를 선택합니다.
2. GitHub에 연결해 `seagod0719/Findclothes`를 Import합니다.
3. Framework Preset: **Next.js** / Root Directory: **./** / Build Command: 기본값(`next build`) / Output Directory: 기본값을 사용합니다.
4. Project Settings → Environment Variables에서 `OPENAI_API_KEY`를 **Production, Preview, Development** 중 사용할 환경에 설정합니다. 필요하면 `OPENAI_MODEL=gpt-4.1-mini`을 추가합니다.
5. **Deploy**를 누릅니다. API 키는 브라우저 코드에 쓰지 말고 서버 환경변수로만 설정하세요.
6. 환경변수를 배포 후 추가했다면 **Redeploy**해야 새 배포에 적용됩니다.

네이버 쇼핑 검색 링크·무신사·Google 쇼핑 링크 사용에는 NAVER_CLIENT_ID/NAVER_CLIENT_SECRET이 필요하지 않습니다. `.env.local`은 로컬 개발 전용이며 GitHub에 올라가지 않습니다.

**주의:** Vercel 요청 본문 크기 한도를 고려하여 사진 파일을 최대 3MB로 제한했습니다. 프리 티어 등의 실행 시간 설정에 따라 AI API 응답이 지연되거나 타임아웃될 수 있습니다. 공개 배포 전에는 API 호출 남용 방지와 사용량 제한을 추가하세요.
