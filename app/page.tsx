"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, CircleHelp, ExternalLink, ImagePlus, LoaderCircle, ScanSearch, Search, ShieldCheck, Shirt, Sparkles, UploadCloud, X } from "lucide-react";

type Garment = { id: number; category: string; name: string; color: string; details: string; query: string };
type Product = { id: string; title: string; link: string; image: string; price: number; mall: string; brand: string };
type Stage = "upload" | "analyzing" | "select" | "searching" | "results";
const demoItems: Garment[] = [
  { id: 1, category: "아우터", name: "빈티지 블랙 레더 재킷", color: "블랙", details: "여유로운 실루엣 · 지퍼 디테일", query: "블랙 오버핏 레더 자켓" },
  { id: 2, category: "상의", name: "화이트 크루넥 티셔츠", color: "화이트", details: "미니멀 · 라운드 넥", query: "화이트 무지 크루넥 티셔츠" },
  { id: 3, category: "하의", name: "워시드 와이드 데님", color: "블루", details: "와이드 핏 · 워싱 데님", query: "블루 워싱 와이드 청바지" },
  { id: 4, category: "신발", name: "블랙 레더 부츠", color: "블랙", details: "심플한 가죽 부츠", query: "블랙 레더 첼시 부츠" },
];
const demos = [
  { image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=700&auto=format&fit=crop&q=85", label: "CITY CLASSIC" },
  { image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=700&auto=format&fit=crop&q=85", label: "EFFORTLESS" },
  { image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=700&auto=format&fit=crop&q=85", label: "STREET STYLE" },
];

export default function Home() {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState("");
  const [stage, setStage] = useState<Stage>("upload");
  const [items, setItems] = useState<Garment[]>([]);
  const [active, setActive] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);
  const [sort, setSort] = useState("relevance");
  const [maxPrice, setMaxPrice] = useState("");
  const [drag, setDrag] = useState(false);
  const garment = items[active];
  const filtered = products.filter(p => !maxPrice || p.price <= Number(maxPrice)).sort((a, b) => sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : 0);

  function load(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 4 * 1024 * 1024) {
      setError("JPG, PNG, WEBP 이미지만 업로드할 수 있으며 크기는 4MB 이하여야 합니다.");
      return;
    }
    setError(""); setItems([]); setProducts([]); setDemo(false); setStage("upload");
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result || ""));
    reader.readAsDataURL(file);
  }
  function onInput(e: ChangeEvent<HTMLInputElement>) { load(e.target.files?.[0]); e.target.value = ""; }
  function onDrop(e: DragEvent<HTMLElement>) { e.preventDefault(); setDrag(false); load(e.dataTransfer.files?.[0]); }
  async function analyze() {
    if (!preview) return;
    setError(""); setStage("analyzing");
    try {
      const r = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: preview }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "분석에 실패했습니다.");
      if (!data.items?.length) throw new Error("사진에서 의상을 찾지 못했습니다. 옷이 잘 보이는 사진으로 다시 시도해 주세요.");
      setItems(data.items); setActive(0); setStage("select");
    } catch (e) { setError(e instanceof Error ? e.message : "분석에 실패했습니다."); setStage("upload"); }
  }
  function tryDemo() { setDemo(true); setError(""); setItems(demoItems); setActive(0); setProducts([]); setStage("select"); }
  async function search(index = active) {
    setActive(index); setProducts([]); setError(""); setSort("relevance"); setMaxPrice(""); setStage("searching");
    try {
      const r = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: items[index].query }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "상품 검색에 실패했습니다.");
      setProducts(data.items || []); setStage("results");
    } catch (e) { setError(e instanceof Error ? e.message : "상품 검색에 실패했습니다."); setStage("select"); }
  }
  function reset() { setPreview(""); setStage("upload"); setItems([]); setProducts([]); setError(""); setDemo(false); }
  return <div className="site">
    <header className="header"><a href="/" className="brand"><span className="brand-mark">f<span>.</span></span><span>findclothes<span className="brand-period">.</span></span></a><nav><a href="#how">HOW IT WORKS</a><a href="#inspiration">INSPIRATION</a></nav><button className="header-cta" onClick={() => { reset(); input.current?.click(); }}>FIND YOUR LOOK <ArrowUpRight size={15}/></button></header>
    <main>
      {stage === "upload" ? <>
        <section className="hero">
          <div className="hero-left"><div className="eyebrow"><span className="eyebrow-line"/> YOUR STYLE, DECODED BY AI <span className="eyebrow-star">✳</span></div>
            <h1>Seen it.<br/>Loved it.<br/><span>Find it<span className="lime-dot">.</span></span></h1>
            <p className="hero-desc">그 사진 속 바로 그 옷.<br/>이미지 한 장으로 원하는 스타일을 찾아보세요.</p>
            <div className="hero-actions"><button className="primary-btn" onClick={() => input.current?.click()}>사진으로 옷 찾기 <ArrowUpRight size={19}/></button><button className="text-btn" onClick={tryDemo}>먼저 체험해보기 <ArrowRight size={17}/></button></div>
            <div className="hero-footer"><div className="avatars"><span>F</span><span>C</span><span>✳</span></div><span>THE OUTFIT YOU WANT,<br/><strong>JUST ONE PHOTO AWAY.</strong></span></div>
          </div>
          <div className="hero-right"><div className="hero-photo"><img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1100&auto=format&fit=crop&q=85" alt="스트리트 패션 스타일 영감" /><div className="hero-photo-overlay"><span>01 / YOUR NEXT OBSESSION</span><span className="hero-overlay-icon">↗</span></div></div><div className="rotated-label">STYLE IS EVERYWHERE — 2026</div><div className="photo-badge"><Sparkles size={20}/><span>SPOTTED IT?<br/><b>LET'S FIND IT.</b></span></div></div>
        </section>
        <section className="upload-section" id="upload"><div className="section-top"><span className="section-number">01 — START HERE</span><span>THE SEARCH STARTS WITH A PHOTO ↘</span></div>
          <div className="upload-heading"><h2>Upload your <em>inspiration.</em></h2><p>공항 패션부터 인스타 속 코디까지,<br/>찾고 싶은 스타일을 올려주세요.</p></div>
          <div className={"dropzone "+(drag?"drag":"")} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={onDrop}>
            {preview ? <><img className="preview-image" src={preview} alt="업로드한 사진" /><button className="remove-image" onClick={reset} aria-label="이미지 제거"><X size={18}/></button><p className="drop-caption">READY TO FIND YOUR LOOK</p><button className="primary-btn" onClick={analyze}>AI로 의상 분석하기 <Sparkles size={18}/></button></> :
              <><div className="upload-icon"><ImagePlus size={29} strokeWidth={1.4}/></div><h3>Drop your photo here<span>.</span></h3><p>사진을 드래그하거나 아래 버튼을 눌러주세요</p><button className="secondary-btn" onClick={() => input.current?.click()}><UploadCloud size={18}/> 이미지 선택하기</button><small>JPG, PNG, WEBP · 최대 4MB</small></>}
          </div>{error && <div className="alert" role="alert">{error}</div>}
        </section>
      </> : <>
        <section className="workspace"><button className="back-btn" onClick={() => stage === "results" ? setStage("select") : reset()}><ArrowLeft size={18}/> {stage === "results" ? "의상 선택으로 돌아가기" : "다른 사진 업로드"}</button>
          <div className="workspace-heading"><span className="section-number">YOUR STYLE SEARCH / {stage === "results" ? "02 RESULTS" : "01 ANALYSIS"}</span><h1>{stage === "analyzing" ? "Decoding your look" : stage === "searching" ? "Finding your pieces" : stage === "results" ? "The pieces, found." : "Pick your piece."}<span className="lime-dot">.</span></h1><p>{stage === "select" ? "찾고 싶은 의상을 골라 상품을 검색해보세요." : stage === "results" ? "검색어와 관련된 실제 쇼핑 상품입니다. 동일 제품 여부는 별도로 확인해 주세요." : "잠시만요. 스타일을 살펴보고 있어요."}</p></div>
          {demo && <div className="demo-notice">DEMO MODE — 아래 아이템은 업로드된 사진의 AI 분석 결과가 아닌 예시 데이터입니다.</div>}
          <div className="workspace-grid"><div className="selected-photo">{preview ? <img src={preview} alt="분석 중인 스타일 사진"/> : <div className="demo-photo"><Shirt size={75}/><span>DEMO EXPERIENCE</span></div>}<span className="photo-index">YOUR REFERENCE / 001</span></div>
            <div className="analysis-panel">
              {stage === "analyzing" || stage === "searching" ? <div className="loading-state"><LoaderCircle className="spin" size={44}/><h3>{stage === "analyzing" ? "AI가 의상을 분석하고 있어요" : "쇼핑 상품을 찾고 있어요"}</h3><p>사진 속 디테일을 살펴보는 중입니다.</p></div> :
              <><div className="panel-top"><span>{stage === "results" ? "SEARCHED ITEM" : "DETECTED PIECES"}</span><span>{String(items.length).padStart(2,"0")} ITEMS</span></div>
                <div className="garment-list">{items.map((item, index) => <button key={item.id} className={"garment "+(active===index?"active":"")} onClick={()=>{setActive(index);if(stage==="results"){setStage("select");setProducts([]);}}}><span className="garment-num">{String(index+1).padStart(2,"0")}</span><span className="garment-name"><b>{item.name}</b><small>{item.category} · {item.details}</small></span>{active===index?<span className="selected-icon"><Check size={16}/></span>:<ArrowUpRight size={19}/>}</button>)}</div>
                {stage === "select" && <><div className="selected-detail"><span>SELECTED PIECE</span><strong>{garment?.name}</strong><p>{garment?.color} / {garment?.details}</p><small>추천 검색어: {garment?.query}</small></div><button className="primary-btn wide" onClick={()=>search()}>비슷한 상품 찾아보기 <Search size={19}/></button></>}
                {stage === "results" && <div className="selected-detail"><span>SEARCH QUERY</span><strong>{garment?.query}</strong><p>{products.length}개 상품 검색됨</p></div>}
              </>}
            </div></div>
          {stage === "results" && <section className="result-section"><div className="result-title"><div><span className="section-number">02 — SHOP THE LOOK</span><h2>Get the <em>look.</em></h2></div><span className="result-count">{filtered.length} RESULTS</span></div><div className="disclaimer"><CircleHelp size={17}/><span>네이버 쇼핑의 검색어 관련도순 결과입니다. 사진과의 시각적 유사도나 동일 브랜드·제품은 검증되지 않았으며 가격은 변동될 수 있습니다.</span></div><div className="filters"><label>정렬 <span className="select-wrap"><select value={sort} onChange={e=>setSort(e.target.value)}><option value="relevance">검색 관련도순</option><option value="low">낮은 가격순</option><option value="high">높은 가격순</option></select><ChevronDown size={16}/></span></label><label>가격 <span className="select-wrap"><select value={maxPrice} onChange={e=>setMaxPrice(e.target.value)}><option value="">전체 가격</option><option value="50000">5만원 이하</option><option value="100000">10만원 이하</option><option value="200000">20만원 이하</option><option value="500000">50만원 이하</option></select><ChevronDown size={16}/></span></label></div>
              {filtered.length ? <div className="product-grid">{filtered.map((p,i)=><a className="product" href={p.link} target="_blank" rel="noopener noreferrer" key={p.id+"-"+i}><div className="product-image"><img src={p.image} alt={p.title} loading="lazy" referrerPolicy="no-referrer" /><span className="product-link"><ArrowUpRight size={20}/></span></div><div className="product-meta"><span>{p.brand || p.mall}</span><span>{String(i+1).padStart(2,"0")}</span></div><h3>{p.title}</h3><div className="product-bottom"><strong>{p.price.toLocaleString("ko-KR")}원</strong><span>{p.mall} <ExternalLink size={12}/></span></div></a>)}</div>:<div className="empty-results">조건에 맞는 상품이 없습니다. 가격 필터를 변경하거나 다른 의상을 선택해 주세요.</div>}</section>}
          {error && <div className="alert" role="alert">{error}</div>}
        </section>
      </>}
      <section className="how" id="how"><div className="section-top"><span className="section-number">02 — HOW IT WORKS</span><span>THREE STEPS TO YOUR NEXT LOOK ↘</span></div><h2>See it. Search it.<br/><em>Wear it.</em></h2><div className="steps"><div><span>01 / UPLOAD</span><ImagePlus size={35}/><h3>스냅 한 장이면 충분해요.</h3><p>연예인 공항 패션, SNS 속 스타일 등 마음에 드는 사진을 올려주세요.</p></div><div><span>02 / DISCOVER</span><ScanSearch size={35}/><h3>AI가 옷을 찾아내요.</h3><p>사진 속 상의, 하의, 신발을 구분하고 스타일과 디테일을 분석해요.</p></div><div><span>03 / SHOP</span><Shirt size={35}/><h3>나만의 스타일로 완성.</h3><p>검색된 상품을 가격별로 살펴보고 원하는 쇼핑몰로 이동하세요.</p></div></div></section>
      <section className="inspiration" id="inspiration"><div className="section-top"><span className="section-number">03 — THE MOODBOARD</span><span>INSPIRED BY WHAT YOU SEE ↘</span></div><div className="inspiration-head"><h2>Style is <em>everywhere.</em></h2><p>오늘의 룩은 어디에서<br/>발견하게 될까요?</p></div><div className="inspo-grid">{demos.map((x,i)=><div className="inspo-card" key={x.label}><img src={x.image} alt={x.label}/><div><span>0{i+1} / {x.label}</span><ArrowUpRight size={20}/></div></div>)}</div></section>
      <section className="bottom-cta"><span>DON'T JUST SAVE THE LOOK.</span><h2>Make it <em>yours.</em></h2><button onClick={()=>{reset();window.scrollTo({top:0,behavior:"smooth"});setTimeout(()=>input.current?.click(),250);}}>지금 바로 스타일 찾기 <ArrowUpRight size={20}/></button></section>
    </main>
    <footer><div className="footer-brand">findclothes<span>.</span></div><p>YOUR STYLE, YOUR WAY. © 2026 FINDCLOTHES</p><a href="#how">BACK TO TOP ↑</a></footer>
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={onInput} hidden aria-label="사진 업로드"/>
  </div>;
}
