# Findclothes

사진 속 스타일을 분석해 원하는 의상을 선택하고 국내 쇼핑 상품을 찾아보는 반응형 웹앱입니다.

## 구현 현황

- JPG/PNG/WEBP 사진 업로드, 미리보기, 드래그앤드롭 (최대 4MB)
- OpenAI 비전 모델을 이용한 상의·하의·아우터·신발·가방 등 의상 분석
- 의상별 선택, 검색어 자동 생성
- 네이버 쇼핑 검색 API를 이용한 실제 판매 상품 검색 및 쇼핑몰 이동
- 가격 필터, 관련도/가격순 정렬, 오류 메시지 및 모바일 UI
- API 키 없이 레이아웃과 의상 선택 흐름을 살펴볼 수 있는 **데모 체험** (실제 AI 분석 결과가 아님)

**중요:** 현재 결과는 네이버 쇼핑의 **검색어 관련도** 기준입니다. 이미지 임베딩을 이용한 시각적 유사도 검증, 동일 제품 확정, 연예인 착용 제품의 별도 근거 검색은 아직 구현되지 않았습니다. 이 단계에서 브랜드·동일 상품 일치를 주장하지 않습니다.

## 로컬 실행

Node.js 20 이상 권장.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Windows PowerShell에서는 `Copy-Item .env.example .env.local`을 사용하세요. 브라우저에서 http://localhost:3000 을 엽니다.

### 환경변수

`.env.local`에 입력합니다. 키를 GitHub에 올리지 마세요.

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-mini
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
```

- OpenAI: 이미지 분석용 API 키와 결제/사용 한도가 필요합니다.
- NAVER: [네이버 개발자 센터](https://developers.naver.com/)에서 애플리케이션 등록 후 **검색 > 쇼핑** API를 사용합니다.
- 각 API는 제공사의 약관과 사용량 제한이 적용됩니다.
- 키가 없으면 실제 분석/검색 버튼은 설정 필요 오류를 표시합니다. 데모 체험은 예시 의상 목록만 표시하며, 그 상태에서 상품 검색을 실행하면 네이버 API 키가 필요합니다.

### 프로덕션 배포

Vercel 등 Next.js를 실행할 수 있는 환경에 저장소를 연결하고 위 환경변수를 **서버 환경변수**로 추가하세요. 배포 시에는 `npm run build && npm run start`가 기본 실행 경로입니다. 업로드 이미지는 DB/스토리지에 저장하지 않고 분석 요청 중에만 서버에서 처리합니다. 단, 외부 AI API로 전송되므로 공개 서비스 전에는 개인정보 및 이미지 이용 안내가 필요합니다.

## 개발 예정

1. 선택한 의상 영역 크롭 및 이미지 임베딩(CLIP/SigLIP) 유사도 재정렬
2. 브랜드/정확한 제품 식별을 뒷받침하는 출처 탐색
3. 재고·가격 동기화, 북마크 및 검색 내역
4. 이미지 업로드 요청 제한/남용 방지 및 운영 정책

## 기술

Next.js App Router, TypeScript, React, OpenAI Chat Completions Vision, NAVER Shopping Search API.
