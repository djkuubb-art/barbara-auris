type Env = {
  ASSETS: { fetch(request: Request): Promise<Response> };
  STRIPE_SECRET_KEY: string;
  SITE_URL?: string;
};

type AnalysisPayload = {
  yourName?: string;
  theirName?: string;
  yourBirth?: string;
  theirBirth?: string;
  relation?: string;
  contact?: string;
  initiates?: string;
  compatibility?: number;
  attraction?: number;
  emotions?: number;
  communication?: number;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function safeText(value: unknown, max = 180) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeScore(value: unknown) {
  const score = Number(value);
  if (!Number.isFinite(score)) return "";
  return String(Math.max(0, Math.min(100, Math.round(score))));
}

async function createCheckout(request: Request, env: Env) {
  if (!env.STRIPE_SECRET_KEY) {
    return json({ error: "Płatności nie są jeszcze skonfigurowane." }, 503);
  }

  let analysis: AnalysisPayload = {};
  try {
    const body = (await request.json()) as { analysis?: AnalysisPayload };
    analysis = body.analysis ?? {};
  } catch {
    return json({ error: "Nieprawidłowe dane żądania." }, 400);
  }

  const yourName = safeText(analysis.yourName, 60);
  const theirName = safeText(analysis.theirName, 60);

  if (!yourName || !theirName) {
    return json({ error: "Brakuje danych analizy." }, 400);
  }

  const requestUrl = new URL(request.url);
  const siteUrl = (env.SITE_URL || requestUrl.origin).replace(/\/$/, "");
  const params = new URLSearchParams();

  params.append("mode", "payment");
  params.append("locale", "pl");
  params.append("payment_method_types[]", "card");
  params.append("payment_method_types[]", "blik");
  params.append("line_items[0][price_data][currency]", "pln");
  params.append("line_items[0][price_data][unit_amount]", "2990");
  params.append("line_items[0][price_data][product_data][name]", "Pełna analiza relacji — Barbara Auris");
  params.append("line_items[0][price_data][product_data][description]", `Pełny odczyt relacji: ${yourName} × ${theirName}`);
  params.append("line_items[0][quantity]", "1");
  params.append("success_url", `${siteUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`);
  params.append("cancel_url", `${siteUrl}/?payment=cancelled`);
  params.append("payment_intent_data[description]", "Barbara Auris — pełna analiza relacji");

  const metadata: Record<string, string> = {
    yourName,
    theirName,
    yourBirth: safeText(analysis.yourBirth, 20),
    theirBirth: safeText(analysis.theirBirth, 20),
    relation: safeText(analysis.relation),
    contact: safeText(analysis.contact),
    initiates: safeText(analysis.initiates),
    compatibility: safeScore(analysis.compatibility),
    attraction: safeScore(analysis.attraction),
    emotions: safeScore(analysis.emotions),
    communication: safeScore(analysis.communication),
  };

  for (const [key, value] of Object.entries(metadata)) {
    if (value) params.append(`metadata[${key}]`, value);
  }

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const session = (await stripeResponse.json()) as { url?: string; error?: unknown };

  if (!stripeResponse.ok || !session.url) {
    console.error("Stripe checkout error", session);
    return json({ error: "Nie udało się uruchomić płatności. Spróbuj ponownie." }, 502);
  }

  return json({ url: session.url });
}

async function paymentStatus(request: Request, env: Env) {
  if (!env.STRIPE_SECRET_KEY) {
    return json({ error: "Płatności nie są jeszcze skonfigurowane." }, 503);
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId || !sessionId.startsWith("cs_")) {
    return json({ error: "Nieprawidłowy identyfikator płatności." }, 400);
  }

  const stripeResponse = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    {
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
    }
  );

  if (!stripeResponse.ok) {
    return json({ error: "Nie udało się sprawdzić płatności." }, 502);
  }

  const session = (await stripeResponse.json()) as {
    payment_status?: string;
    status?: string;
    metadata?: Record<string, string>;
  };

  return json({
    paid: session.payment_status === "paid",
    status: session.status ?? null,
    paymentStatus: session.payment_status ?? null,
    metadata: session.payment_status === "paid" ? session.metadata ?? {} : {},
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/checkout" && request.method === "POST") {
      return createCheckout(request, env);
    }

    if (url.pathname === "/api/payment-status" && request.method === "GET") {
      return paymentStatus(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
