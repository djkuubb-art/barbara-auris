type StripeSession = {
  id?: string;
  payment_status?: string;
  status?: string;
  metadata?: Record<string, string>;
};

export const dynamic = "force-dynamic";

function numberFrom(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : fallback;
}

async function getSession(sessionId: string): Promise<StripeSession | null> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;

  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    {
      headers: { Authorization: `Bearer ${secretKey}` },
      cache: "no-store",
    }
  );

  if (!response.ok) return null;
  return response.json();
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    return <PaymentState title="Brakuje identyfikatora płatności" copy="Wróć do strony głównej i uruchom analizę ponownie." />;
  }

  const session = await getSession(sessionId);

  if (!session) {
    return <PaymentState title="Nie udało się sprawdzić płatności" copy="Odśwież tę stronę za chwilę. Jeśli płatność została pobrana, wynik nie przepada." />;
  }

  if (session.payment_status !== "paid") {
    return <PaymentState title="Płatność jest jeszcze potwierdzana" copy="Po zatwierdzeniu przez bank odśwież tę stronę. Pełna analiza pojawi się po potwierdzeniu płatności." />;
  }

  const meta = session.metadata ?? {};
  const yourName = meta.yourName || "Ty";
  const theirName = meta.theirName || "druga osoba";
  const attraction = numberFrom(meta.attraction, 84);
  const emotions = numberFrom(meta.emotions, 78);
  const communication = numberFrom(meta.communication, 72);
  const compatibility = numberFrom(meta.compatibility, 82);

  const contactHint = meta.contact
    ? `Obecny kontakt („${meta.contact.toLowerCase()}”) wskazuje, że rytm tej relacji ma duży wpływ na poczucie bezpieczeństwa po obu stronach.`
    : "Rytm kontaktu ma tu duży wpływ na poczucie bezpieczeństwa po obu stronach.";

  const initiativeHint = meta.initiates
    ? `Przy układzie inicjatywy „${meta.initiates.toLowerCase()}” łatwo o nadinterpretowanie ciszy albo pojedynczych sygnałów.`
    : "Nierówna inicjatywa może prowadzić do nadinterpretowania ciszy albo pojedynczych sygnałów.";

  return (
    <main className="page-shell result-shell">
      <div className="mist mist-one" />
      <div className="mist mist-two" />
      <section className="result-card glass">
        <div className="eyebrow">BARBARA AURIS • PEŁNA ANALIZA</div>
        <div className="names">{yourName} <span>×</span> {theirName}</div>

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
          <div className="teaser-label">Co {theirName} naprawdę czuje?</div>
          <p>
            Odczyt sugeruje realne zainteresowanie i emocjonalną reakcję na Waszą relację, ale nie pokazuje pełnej swobody w okazywaniu tego wprost. Im mocniejsze przyciąganie, tym większa może być jednocześnie ostrożność przed odsłonięciem się lub utratą kontroli nad sytuacją.
          </p>
          <p>
            {theirName} może więc wysyłać sygnały, które momentami wydają się sprzeczne: zbliżenie, a potem dystans. To bardziej przypomina wewnętrzne wahanie niż całkowity brak emocji.
          </p>
        </div>

        <div className="teaser-box">
          <div className="teaser-label">Co najbardziej blokuje Wasze połączenie?</div>
          <p>{contactHint} {initiativeHint}</p>
          <p>
            Największym problemem nie wygląda sama chemia, lecz sposób reagowania na niepewność. Gdy jedna strona zaczyna analizować, druga może wycofać się jeszcze bardziej, co tworzy pętlę napięcia zamiast jasnej komunikacji.
          </p>
        </div>

        <div className="teaser-box">
          <div className="teaser-label">Najbardziej prawdopodobny rozwój relacji</div>
          <p>
            Przy obecnym układzie ta relacja ma większy potencjał do stopniowego zbliżenia niż do gwałtownego przełomu. Najwięcej zmieni nie jeden mocny gest, lecz kilka spokojnych, spójnych interakcji bez presji na natychmiastowe deklaracje.
          </p>
          <p>
            Jeśli komunikacja pozostanie chaotyczna, napięcie będzie wracać. Jeśli pojawi się więcej przewidywalności i mniej testowania drugiej osoby, dynamika może wyraźnie się uspokoić.
          </p>
        </div>

        <div className="teaser-box">
          <div className="teaser-label">Twój najlepszy kolejny krok</div>
          <p>
            Nie próbuj wymuszać odpowiedzi ani „sprawdzać”, co {theirName} zrobi pod presją. Lepszy będzie jeden konkretny, lekki sygnał zainteresowania i pozostawienie przestrzeni na naturalną odpowiedź.
          </p>
          <p>
            Skup się bardziej na konsekwencji zachowania niż na pojedynczych wiadomościach. To da Ci znacznie więcej informacji o realnym kierunku tej relacji niż analizowanie każdego drobnego sygnału osobno.
          </p>
        </div>

        <div className="paywall glass-dark">
          <div className="paywall-kicker">PŁATNOŚĆ POTWIERDZONA</div>
          <h2>Pełny odczyt został odblokowany</h2>
          <p>Możesz zachować tę stronę i wrócić do wyniku później.</p>
        </div>

        <a className="text-button" href="/">Zacznij nową analizę</a>
      </section>
      <Footer />
    </main>
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

function PaymentState({ title, copy }: { title: string; copy: string }) {
  return (
    <main className="page-shell loading-shell">
      <div className="mist mist-one" />
      <div className="mist mist-two" />
      <section className="loading-card glass">
        <div className="orb large-orb"><div className="orb-core">✦</div></div>
        <div className="eyebrow">BARBARA AURIS</div>
        <h1>{title}</h1>
        <p className="loading-copy">{copy}</p>
        <a className="primary-button" href="/">Wróć do Barbary</a>
      </section>
    </main>
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
