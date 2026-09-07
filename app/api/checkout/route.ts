import { NextRequest, NextResponse } from "next/server";

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

function safeText(value: unknown, max = 180) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeScore(value: unknown) {
  const score = Number(value);
  if (!Number.isFinite(score)) return "";
  return String(Math.max(0, Math.min(100, Math.round(score))));
}

export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json(
      { error: "Płatności nie są jeszcze skonfigurowane." },
      { status: 503 }
    );
  }

  let analysis: AnalysisPayload = {};

  try {
    const body = await request.json();
    analysis = body?.analysis ?? {};
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe dane żądania." }, { status: 400 });
  }

  const yourName = safeText(analysis.yourName, 60);
  const theirName = safeText(analysis.theirName, 60);

  if (!yourName || !theirName) {
    return NextResponse.json({ error: "Brakuje danych analizy." }, { status: 400 });
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin).replace(/\/$/, "");
  const params = new URLSearchParams();

  params.append("mode", "payment");
  params.append("locale", "pl");
  params.append("payment_method_types[]", "card");
  params.append("payment_method_types[]", "blik");
  params.append("line_items[0][price_data][currency]", "pln");
  params.append("line_items[0][price_data][unit_amount]", "2990");
  params.append(
    "line_items[0][price_data][product_data][name]",
    "Pełna analiza relacji — Barbara Auris"
  );
  params.append(
    "line_items[0][price_data][product_data][description]",
    `Pełny odczyt relacji: ${yourName} × ${theirName}`
  );
  params.append("line_items[0][quantity]", "1");
  params.append(
    "success_url",
    `${siteUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`
  );
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

  Object.entries(metadata).forEach(([key, value]) => {
    if (value) params.append(`metadata[${key}]`, value);
  });

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    cache: "no-store",
  });

  const session = await stripeResponse.json();

  if (!stripeResponse.ok || !session?.url) {
    console.error("Stripe checkout error", session);
    return NextResponse.json(
      { error: "Nie udało się uruchomić płatności. Spróbuj ponownie." },
      { status: 502 }
    );
  }

  return NextResponse.json({ url: session.url });
}
