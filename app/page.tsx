"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, CircleHelp, Globe2, ImagePlus, LoaderCircle, ScanSearch, Search, Shirt, Sparkles, UploadCloud, X } from "lucide-react";
import { languageOptions, Locale, translate } from "@/lib/i18n";

type Garment = { id: number; category: string; name: string; color: string; details: string; query: string };
type ShopLink = { name: string; url: string; description: string };
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
  const [searchLinks, setSearchLinks] = useState<ShopLink[]>([]);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);
  const [drag, setDrag] = useState(false);
  const [importing, setImporting] = useState(false);
  const [locale, setLocale] = useState<Locale>("ko");
  const [languageOpen, setLanguageOpen] = useState(false);
  const languageMenu = useRef<HTMLDivElement>(null);
  const t = (key: string) => translate(locale, key);
  const garment = items[active];

  useEffect(() => {
    const saved = localStorage.getItem("findclothes-locale");
    if (languageOptions.some(option => option.code === saved)) {
      setLocale(saved as Locale);
      document.documentElement.lang = saved as Locale;
    }
    const onOutside = (event: PointerEvent) => {
      if (!languageMenu.current?.contains(event.target as Node)) setLanguageOpen(false);
    };
    document.addEventListener("pointerdown", onOutside);
    return () => document.removeEventListener("pointerdown", onOutside);
  }, []);

  function changeLanguage(next: Locale) {
    setLocale(next);
    if (demo) {
      const labels = ["demoOuter", "demoTop", "demoBottom", "demoShoes"];
      setItems(demoItems.map((item, index) => ({
        ...item, name: translate(next, labels[index]), details: translate(next, labels[index] + "Details"),
      })));
    }
    setLanguageOpen(false);
    localStorage.setItem("findclothes-locale", next);
    document.documentElement.lang = next;
  }

  useEffect(() => {
    const over = (event: globalThis.DragEvent) => {
      event.preventDefault();
      if (event.dataTransfer && Array.from(event.dataTransfer.types).some(type =>
        ["Files", "text/uri-list", "text/html"].includes(type))) setDrag(true);
    };
    const leave = (event: globalThis.DragEvent) => {
      if (!event.relatedTarget) setDrag(false);
    };
    const drop = (event: globalThis.DragEvent) => {
      event.preventDefault();
      setDrag(false);
      void handleDrop(event.dataTransfer);
    };
    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    const paste = (event: ClipboardEvent) => {
      const target = event.target;
      // Keep ordinary text editing and pasting into form controls intact.
      if (target instanceof HTMLElement && target.closest("input, textarea, [contenteditable], [role='textbox']")) return;
      const data = event.clipboardData;
      if (!data || importing) return;
      const hasImage = Array.from(data.files).some(file => file.type.startsWith("image/")) ||
        Array.from(data.items).some(item => item.type.startsWith("image/"));
      const html = data.getData("text/html");
      const hasHtmlImage = html ? /<img\\b/i.test(html) : false;
      const text = data.getData("text/plain").trim();
      const hasImageUrl = /^https:\\/\\/\\S+$/i.test(text) &&
        /\\.(?:png|jpe?g|webp)(?:[?#]|$)/i.test(text);
      if (!hasImage && !hasHtmlImage && !hasImageUrl) return;
      event.preventDefault();
      // Reuse the same file / external-image import path as drag-and-drop.
      void handleDrop(data);
    };
    window.addEventListener("paste", paste);
    return () => {
      window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop);
      window.removeEventListener("paste", paste);
    };
  // Bind the handler to the current language for localized messages.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, importing]);

  function load(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 3 * 1024 * 1024) {
      setError(t("imgTypeError"));
      return;
    }
    setError(""); setItems([]); setSearchLinks([]); setDemo(false); setStage("upload");
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result || ""));
    reader.readAsDataURL(file);
  }
  function onInput(e: ChangeEvent<HTMLInputElement>) { load(e.target.files?.[0]); e.target.value = ""; }

  async function handleDrop(data: DataTransfer | null) {
    if (!data || importing) return;
    setDrag(false);
    const file = Array.from(data.files).find(entry => entry.type.startsWith("image/"));
    if (file) { load(file); return; }

    const html = data.getData("text/html");
    let url = "";
    if (html) {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const image = doc.querySelector("img");
      url = image?.getAttribute("src") || image?.getAttribute("data-src") || "";
    }
    if (!url) {
      const raw = data.getData("text/uri-list") || data.getData("text/plain");
      url = raw.split(/\r?\n/).find(line => /^https?:\/\//i.test(line.trim()))?.trim() || "";
    }
    if (!url || !/^https:\/\//i.test(url)) {
      setError(t("urlError"));
      return;
    }
    setImporting(true); setError("");
    try {
      const response = await fetch("/api/import-image", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const result = await response.json();
      if (!response.ok || typeof result.image !== "string") throw new Error("Import failed");
      setItems([]); setSearchLinks([]); setDemo(false); setStage("upload");
      setPreview(result.image);
    } catch {
      setError(t("importError"));
    } finally { setImporting(false); }
  }
  function onDrop(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    e.stopPropagation();
    void handleDrop(e.dataTransfer);
  }

  async function analyze() {
    if (!preview) return;
    setError(""); setStage("analyzing");
    try {
      const r = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: preview, locale }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || t("analyzeError"));
      if (!data.items?.length) throw new Error(t("noItems"));
      setItems(data.items); setActive(0); setStage("select");
    } catch (e) { setError(e instanceof Error ? e.message : t("analyzeError")); setStage("upload"); }
  }
  function tryDemo() {
    const labels = ["demoOuter", "demoTop", "demoBottom", "demoShoes"];
    const translated = demoItems.map((item, index) => ({
      ...item, name: t(labels[index]), details: t(labels[index] + "Details"),
    }));
    setDemo(true); setError(""); setItems(translated); setActive(0); setSearchLinks([]); setStage("select"); }
  async function search(index = active) {
    setActive(index); setSearchLinks([]); setError(""); setStage("searching");
    try {
      const r = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: items[index].query, locale }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || t("searchError"));
      setSearchLinks(data.links || []); setStage("results");
    } catch (e) { setError(e instanceof Error ? e.message : t("searchError")); setStage("select"); }
  }
  function reset() { setPreview(""); setStage("upload"); setItems([]); setSearchLinks([]); setError(""); setDemo(false); }
  return <div className="site">
    {drag && <div className="global-drop-overlay" aria-hidden="true"><ImagePlus size={44}/><strong>{t("dropTitle")}</strong><span>{t("dropHelp")}</span></div>}
    <header className="header"><a href="/" className="brand"><span className="brand-mark">f<span>.</span></span><span>findclothes<span className="brand-period">.</span></span></a><nav><a href="#how">{t("howNav")}</a><a href="#inspiration">{t("inspoNav")}</a></nav>
      <div className="header-actions">
        <div className="language-picker" ref={languageMenu}>
          <button type="button" className="language-button" aria-label={t("lang")} aria-haspopup="menu" aria-expanded={languageOpen} onClick={() => setLanguageOpen(value => !value)}>
            <Globe2 size={19}/><span>{locale.toUpperCase()}</span><ChevronDown size={14}/>
          </button>
          {languageOpen && <div className="language-menu" role="menu">{languageOptions.map(option =>
            <button type="button" role="menuitemradio" aria-checked={locale === option.code} key={option.code} onClick={() => changeLanguage(option.code)}>
              <span>{option.label}</span>{locale === option.code && <Check size={15}/>}
            </button>)}</div>}
        </div>
        <button className="header-cta" onClick={() => { reset(); input.current?.click(); }}>{t("find")} <ArrowUpRight size={15}/></button>
      </div></header>
    <main>
      {stage === "upload" ? <>
        <section className="hero">
          <div className="hero-left"><div className="eyebrow"><span className="eyebrow-line"/> YOUR STYLE, DECODED BY AI <span className="eyebrow-star">✳</span></div>
            <h1>{t("hero1")}<br/>{t("hero2")}<br/><span>{t("hero3")}<span className="lime-dot">.</span></span></h1>
            <p className="hero-desc">{t("heroFirst")}<br/>{t("heroSecond")}</p>
            <div className="hero-upload" id="upload">
          <div className={"dropzone hero-dropzone "+(drag?"drag":"")} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={onDrop} role="region" aria-label={t("dropTitle")}>
            {preview ? <><img className="preview-image" src={preview} alt={t("uploadedAlt")} /><button className="remove-image" onClick={reset} aria-label={t("remove")}><X size={18}/></button><p className="drop-caption">READY TO FIND YOUR LOOK</p><button className="primary-btn" onClick={analyze}>{t("analyze")} <Sparkles size={18}/></button></> :
              <><div className="upload-icon"><ImagePlus size={23} strokeWidth={1.4}/></div><h3>{t("dropTitle")}<span>.</span></h3><p>{t("dropHelp")}</p><button className="secondary-btn" onClick={() => input.current?.click()}><UploadCloud size={18}/> {t("uploadButton")}</button><small>{t("fileHint")}</small></>}
          </div>
{importing && <div className="importing"><LoaderCircle className="spin" size={19}/>{t("importing")}</div>}{error && <div className="alert" role="alert">{error}</div>}
</div><div className="hero-actions hero-actions-compact"><button className="text-btn" onClick={tryDemo}>{t("tryDemo")} <ArrowRight size={17}/></button></div>
            <div className="hero-footer"><div className="avatars"><span>F</span><span>C</span><span>✳</span></div><span>THE OUTFIT YOU WANT,<br/><strong>JUST ONE PHOTO AWAY.</strong></span></div>
          </div>
          <div className="hero-right"><div className="hero-photo"><img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1100&auto=format&fit=crop&q=85" alt="스트리트 패션 스타일 영감" /><div className="hero-photo-overlay"><span>01 / YOUR NEXT OBSESSION</span><span className="hero-overlay-icon">↗</span></div></div><div className="rotated-label">STYLE IS EVERYWHERE — 2026</div><div className="photo-badge"><Sparkles size={20}/><span>SPOTTED IT?<br/><b>LET'S FIND IT.</b></span></div></div>
        </section>

      </> : <>
        <section className="workspace"><button className="back-btn" onClick={() => stage === "results" ? setStage("select") : reset()}><ArrowLeft size={18}/> {stage === "results" ? t("backResult") : t("backUpload")}</button>
          <div className="workspace-heading"><span className="section-number">YOUR STYLE SEARCH / {stage === "results" ? "02 RESULTS" : "01 ANALYSIS"}</span><h1>{stage === "analyzing" ? "Decoding your look" : stage === "searching" ? "Finding your pieces" : stage === "results" ? "Shop your piece" : "Pick your piece."}<span className="lime-dot">.</span></h1><p>{stage === "select" ? t("selectIntro") : stage === "results" ? t("resultsIntro") : t("waitIntro")}</p></div>
          {demo && <div className="demo-notice">{t("demoNotice")}</div>}
          <div className="workspace-grid"><div className="selected-photo">{preview ? <img src={preview} alt="분석 중인 스타일 사진"/> : <div className="demo-photo"><Shirt size={75}/><span>DEMO EXPERIENCE</span></div>}<span className="photo-index">YOUR REFERENCE / 001</span></div>
            <div className="analysis-panel">
              {stage === "analyzing" || stage === "searching" ? <div className="loading-state"><LoaderCircle className="spin" size={44}/><h3>{stage === "analyzing" ? t("loadingAnalyze") : t("loadingSearch")}</h3><p>{t("waitDetails")}</p></div> :
              <><div className="panel-top"><span>{stage === "results" ? t("searched") : t("detected")}</span><span>{String(items.length).padStart(2,"0")} {t("items")}</span></div>
                <div className="garment-list">{items.map((item, index) => <button key={item.id} className={"garment "+(active===index?"active":"")} onClick={()=>{setActive(index);if(stage==="results"){setStage("select");}}}><span className="garment-num">{String(index+1).padStart(2,"0")}</span><span className="garment-name"><b>{item.name}</b><small>{t("cat." + item.category)} · {item.details}</small></span>{active===index?<span className="selected-icon"><Check size={16}/></span>:<ArrowUpRight size={19}/>}</button>)}</div>
                {stage === "select" && <><div className="selected-detail"><span>{t("selected")}</span><strong>{garment?.name}</strong><p>{garment?.color} / {garment?.details}</p><small>{t("query")}: {garment?.query}</small></div><button className="primary-btn wide" onClick={()=>search()}>{t("searchButton")} <Search size={19}/></button></>}
                {stage === "results" && <div className="selected-detail"><span>SEARCH QUERY</span><strong>{garment?.query}</strong><p>{t("shops").replace("{n}", String(searchLinks.length))}</p></div>}
              </>}
            </div></div>
          {stage === "results" && <section className="result-section">
            <div className="result-title"><div><span className="section-number">02 — SHOP THE LOOK</span><h2>Get the <em>look.</em></h2></div><span className="result-count">SHOP SEARCH</span></div>
            <div className="disclaimer"><CircleHelp size={17}/><span>{t("disclaimer")}</span></div>
            <div className="shopping-links">{searchLinks.map(link => <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="shopping-link"><div><span>SEARCH AT</span><h3>{link.name}</h3><p>{link.description}</p></div><ArrowUpRight size={25}/></a>)}</div>
            {!searchLinks.length && <div className="empty-results">{t("noLinks")}</div>}
          </section>}
          {error && <div className="alert" role="alert">{error}</div>}
        </section>
      </>}
      <section className="how" id="how"><div className="section-top"><span className="section-number">02 — HOW IT WORKS</span><span>THREE STEPS TO YOUR NEXT LOOK ↘</span></div><h2>{t("howTitle1")}<br/><em>{t("howTitle2")}</em></h2><div className="steps"><div><span>01 / UPLOAD</span><ImagePlus size={35}/><h3>{t("how1Title")}</h3><p>{t("how1Body")}</p></div><div><span>02 / DISCOVER</span><ScanSearch size={35}/><h3>{t("how2Title")}</h3><p>{t("how2Body")}</p></div><div><span>03 / SHOP</span><Shirt size={35}/><h3>{t("how3Title")}</h3><p>{t("how3Body")}</p></div></div></section>
      <section className="inspiration" id="inspiration"><div className="section-top"><span className="section-number">03 — THE MOODBOARD</span><span>INSPIRED BY WHAT YOU SEE ↘</span></div><div className="inspiration-head"><h2>{t("inspirationTitle")} <em>{t("inspirationItalic")}</em></h2><p>{t("inspirationBody1")}<br/>{t("inspirationBody2")}</p></div><div className="inspo-grid">{demos.map((x,i)=><div className="inspo-card" key={x.label}><img src={x.image} alt={x.label}/><div><span>0{i+1} / {x.label}</span><ArrowUpRight size={20}/></div></div>)}</div></section>
      <section className="bottom-cta"><span>DON'T JUST SAVE THE LOOK.</span><h2>Make it <em>yours.</em></h2><button onClick={()=>{reset();window.scrollTo({top:0,behavior:"smooth"});setTimeout(()=>input.current?.click(),250);}}>{t("bottomCta")} <ArrowUpRight size={20}/></button></section>
    </main>
    <footer><div className="footer-brand">findclothes<span>.</span></div><p>YOUR STYLE, YOUR WAY. © 2026 FINDCLOTHES</p><a href="#how">{t("backTop")}</a></footer>
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={onInput} hidden aria-label="사진 업로드"/>
  </div>;
}
