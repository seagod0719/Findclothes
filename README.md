# Findclothes

사진에서 의상을 분석하고 비슷한 스타일을 쇼핑몰에서 찾아볼 수 있는 Next.js 웹앱입니다.

## 현재 구현

- JPEG/PNG/WEBP 업로드 및 미리보기 (최대 4MB), 드래그 앤 드롭
- OpenAI 비전 API를 통한 이미지 속 의류 개별 인식·검색어 생성
- 원하는 의류 선택 후 **네이버 쇼핑 / 무신사 / Google 쇼핑 검색 결과로 이동**
- 샘플 의상 선택 데모 (실제 이미지 AI 분석 결과가 아님), 모바일 대응

**중요:** NAVER Developers의 기존 **쇼핑 검색 API는 2026-07-31 종료**됐으며 NAVER API HUB로 이관되지 않았습니다. 따라서 상품 사진·상품 가격·상품 개별 링크를 Findclothes 내부에 불러오거나 정확한 동일 제품을 확정하는 기능은 현재 제공하지 않습니다. 옛 API를 호출하는 이전 버전 코드는 사용하지 마세요.

공식 공지:
- https://developers.naver.com/notice/article/32564
- https://developers.naver.com/notice/article/32530

## 시작하기

Node.js 20 이상 권장. 프로젝트 디렉터리에서:

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
