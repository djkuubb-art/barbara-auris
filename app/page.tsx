"use client";

import { useMemo, useState } from "react";

type FormData = {
  yourName: string;
  theirName: string;
  yourBirth: string;
  theirBirth: string;
  relation: string;
  contact: string;
  initiates: string;
};

const initialData: FormData = {
  yourName: "",
  theirName: "",
  yourBirth: "",
  theirBirth: "",
  relation: "",
  contact: "",
  initiates: "",
};

function hashSeed(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  return hash;
}

function scoreFrom(seed: number, offset: number, min = 71, max = 94) {
  const range = max - min + 1;
  return min + ((seed + offset * 977) % range);
}

export default function HomePage() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(initialData);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [analysisStage, setAnalysisStage] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const seed = useMemo(() => hashSeed(Object.values(data).join("|")), [data]);
  const compatibility = scoreFrom(seed, 1, 76, 93);
  const attraction = scoreFrom(seed, 2, 79, 96);
  const emotions = scoreFrom(seed, 3, 70, 91);
  const communication = scoreFrom(seed, 4, 62, 88);

  const stages = [
    "Łączę Wasze dane...",
    "Analizuję dynamikę emocjonalną...",
    "Sprawdzam wzorce przyciągania...",
    "Wykrywam ukryte napięcia i blokady...",
    "Tworzę Wasz profil relacji...",
  ];

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function next() {
    setStep((s) => s + 1);
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  function canContinue() {
    if (step === 0) return data.yourName.trim() && data.theirName.trim();
    if (step === 1) return data.yourBirth && data.theirBirth;
    if (step === 2) return data.relation;
    if (step === 3) return data.contact;
    if (step === 4) return data.initiates;
    return false;
  }

  function startAnalysis() {
    setLoading(true);
    setAnalysisStage(0);
    const delays = [900, 1800, 2700, 3600];
    delays.forEach((delay, idx) => {
      window.setTimeout(() => setAnalysisStage(idx + 1), delay);
    });
    window.setTimeout(() => {
      setLoading(false);
      setShowResult(true);
    }, 4700);
  }

  async function startCheckout() {
    if (checkoutLoading) return;

    setCheckoutLoading(true);
    setCheckoutError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis: {
            ...data,
            compatibility,
            attraction,
            emotions,
            communication,
          },
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error || "Nie udało się uruchomić płatności.");
      }

      window.location.href = payload.url;
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Nie udało się uruchomić płatności.");
      setCheckoutLoading(false);
    }
  }

  if (showResult) {
    return (
      <main className="page-shell result-shell">
        <div className="mist mist-one" />
        <div className="mist mist-two" />
        <section className="result-card glass">
          <div className="eyebrow">BARBARA AURIS • ANALIZA RELACJI</div>
          <div className="names">{data.yourName} <span>×</span> {data.theirName}</div>
          <div className="score-ring" style={{ "--score": `${compatibility * 3.6}deg` } as React.CSSProperties}>
            <div className="score-inner">
              <strong>{compatibility}%</strong>
              <span>zgodności</span>
            </div>
          </div>

          <div className="metrics">
            <Metric label="Przyciąganie" value={attraction} />
            <Metric label="Więź emocjonalna" value={emotions} />
            <Metric label="Komunikacja" value={communication} />
          </div>

          <div className="teaser-box">
            <div className="teaser-label">Pierwszy odczyt Barbary</div>
            <p>
              Między Wami widać wyraźne przyciąganie, ale ta relacja nie jest całkowicie równa emocjonalnie.
              Jedna ze stron mocniej analizuje kontakt i częściej wraca myślami do tego połączenia. Największa blokada
              pojawia się nie w chemii, tylko w sposobie, w jaki każde z Was reaguje na dystans i niepewność.
            </p>
            <p className="teaser-last">W pełnym odczycie pojawił się jeden szczególnie mocny wzorzec dotyczący intencji {data.theirName}.</p>
          </div>

          <div className="locked-stack">
            <Locked title={`Co ${data.theirName} naprawdę czuje?`} subtitle="Ukryte intencje i emocjonalne zaangażowanie" />
            <Locked title="Co najbardziej blokuje Wasze połączenie?" subtitle="Główny wzorzec, który powoduje dystans" />
            <Locked title="Najbardziej prawdopodobny rozwój relacji" subtitle="Jak może zmienić się dynamika w najbliższym czasie" />
            <Locked title="Twój najlepszy kolejny krok" subtitle="Jak zareagować bez pogarszania sytuacji" />
          </div>

          <div className="paywall glass-dark">
            <div className="paywall-kicker">PEŁNA ANALIZA</div>
            <h2>Odkryj cały odczyt Barbary Auris</h2>
            <p>Pełna interpretacja połączenia, emocji, blokad i dalszego kierunku relacji.</p>
            <div className="price">29,90 zł</div>
            <button className="primary-button" disabled={checkoutLoading} onClick={startCheckout}>
              {checkoutLoading ? "Przenoszę do płatności..." : "Odblokuj pełną analizę"}
            </button>
            {checkoutError && <small role="alert">{checkoutError}</small>}
            {!checkoutError && <small>Płatność jednorazowa • karta lub BLIK • bez subskrypcji</small>}
          </div>

          <button className="text-button" onClick={() => { setShowResult(false); setStarted(false); setStep(0); setData(initialData); setCheckoutError(""); }}>Zacznij nową analizę</button>
        </section>
        <Footer />
      </main>
    );
  }

  if (loading) {
    const progress = Math.min(100, 18 + analysisStage * 20);
    return (
      <main className="page-shell loading-shell">
        <div className="mist mist-one" />
        <div className="mist mist-two" />
        <section className="loading-card glass">
          <div className="orb large-orb"><div className="orb-core">✦</div></div>
          <div className="eyebrow">BARBARA AURIS</div>
          <h1>Tworzę Wasz odczyt...</h1>
          <p className="loading-copy">{stages[analysisStage]}</p>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          <div className="progress-number">{progress}%</div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="stars" />
      <div className="mist mist-one" />
      <div className="mist mist-two" />

      {!started ? (
        <section className="hero">
          <div className="hero-visual glass">
            <div className="moon-symbol">☾</div>
            <div className="portrait-placeholder">
              <div className="portrait-halo" />
              <div className="initials">BA</div>
              <div className="portrait-note">tu wstawimy finalne zdjęcie Barbary</div>
            </div>
            <div className="mini-card card-left">✦ intuicja</div>
            <div className="mini-card card-right">♡ relacje</div>
          </div>

          <div className="hero-copy">
            <div className="eyebrow">BARBARA AURIS • ANALIZA POŁĄCZENIA</div>
            <h1>Sprawdź, co naprawdę dzieje się <em>między Wami.</em></h1>
            <p>
              Odpowiedz na kilka krótkich pytań. Barbara połączy Wasze dane i pokaże dynamikę emocjonalną,
              przyciąganie oraz możliwe blokady w tej relacji.
            </p>
            <button className="primary-button hero-button" onClick={() => setStarted(true)}>Sprawdź Wasze połączenie</button>
            <div className="trust-row"><span>✦ 2–3 minuty</span><span>✦ natychmiastowy wynik</span><span>✦ prywatnie</span></div>
          </div>
        </section>
      ) : (
        <section className="quiz-wrap glass">
          <div className="quiz-topline">
            <div><span className="small-orb">✦</span> Barbara Auris</div>
            <span>Krok {step + 1} / 5</span>
          </div>
          <div className="step-track"><div className="step-fill" style={{ width: `${((step + 1) / 5) * 100}%` }} /></div>

          {step === 0 && (
            <div className="quiz-content">
              <div className="step-icon">♡</div>
              <h2>Zacznijmy od Was.</h2>
              <p>Podaj imiona dwóch osób, których połączenie mam przeanalizować.</p>
              <label>Twoje imię<input value={data.yourName} onChange={(e) => update("yourName", e.target.value)} placeholder="np. Anna" /></label>
              <label>Imię drugiej osoby<input value={data.theirName} onChange={(e) => update("theirName", e.target.value)} placeholder="np. Michał" /></label>
            </div>
          )}

          {step === 1 && (
            <div className="quiz-content">
              <div className="step-icon">☾</div>
              <h2>Wasze daty urodzenia</h2>
              <p>Pomagają utrzymać wynik spójny dla tej samej pary.</p>
              <label>Twoja data urodzenia<input type="date" value={data.yourBirth} onChange={(e) => update("yourBirth", e.target.value)} /></label>
              <label>Data urodzenia {data.theirName || "drugiej osoby"}<input type="date" value={data.theirBirth} onChange={(e) => update("theirBirth", e.target.value)} /></label>
            </div>
          )}

          {step === 2 && (
            <ChoiceStep icon="✦" title="Co Was teraz łączy?" subtitle="Wybierz odpowiedź najbardziej zbliżoną do Waszej sytuacji." value={data.relation} onChange={(v) => update("relation", v)} options={["Jesteśmy razem", "Dopiero się poznajemy / flirtujemy", "To mój były / moja była", "Oddaliliśmy się od siebie", "To skomplikowane"]} />
          )}

          {step === 3 && (
            <ChoiceStep icon="◌" title="Jak wygląda teraz Wasz kontakt?" subtitle="To pomaga określić dynamikę napięcia i dystansu." value={data.contact} onChange={(v) => update("contact", v)} options={["Rozmawiamy codziennie", "Kilka razy w tygodniu", "Kontakt jest nieregularny", "Prawie wcale nie rozmawiamy", "Nie mamy teraz kontaktu"]} />
          )}

          {step === 4 && (
            <ChoiceStep icon="∞" title="Kto częściej inicjuje kontakt?" subtitle="Ostatnie pytanie przed analizą." value={data.initiates} onChange={(v) => update("initiates", v)} options={["Ja", data.theirName || "Druga osoba", "Mniej więcej po równo", "To się ciągle zmienia", "Trudno powiedzieć"]} />
          )}

          <div className="quiz-actions">
            <button className="text-button" onClick={step === 0 ? () => setStarted(false) : back}>Wstecz</button>
            {step < 4 ? (
              <button className="primary-button" disabled={!canContinue()} onClick={next}>Dalej</button>
            ) : (
              <button className="primary-button" disabled={!canContinue()} onClick={startAnalysis}>Uruchom analizę</button>
            )}
          </div>
        </section>
      )}
      <Footer />
    </main>
  );
}

function ChoiceStep({ icon, title, subtitle, value, onChange, options }: { icon: string; title: string; subtitle: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="quiz-content">
      <div className="step-icon">{icon}</div>
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <div className="choice-list">
        {options.map((option) => (
          <button key={option} className={`choice ${value === option ? "selected" : ""}`} onClick={() => onChange(option)}>
            <span>{option}</span><b>{value === option ? "✓" : "›"}</b>
          </button>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric">
      <div className="metric-row"><span>{label}</span><strong>{value}%</strong></div>
      <div className="metric-track"><div className="metric-fill" style={{ width: `${value}%` }} /></div>
    </div>
  );
}

function Locked({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="locked-item">
      <div className="lock-icon">⌁</div>
      <div><strong>{title}</strong><span>{subtitle}</span></div>
      <div className="blur-pill">ZABLOKOWANE</div>
    </div>
  );
}

function Footer() {
  return (
    <footer>
      <span>© 2026 Barbara Auris</span>
      <span>Materiał o charakterze rozrywkowym i refleksyjnym. Nie zastępuje profesjonalnej porady.</span>
    </footer>
  );
}
