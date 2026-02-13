import { NextResponse } from "next/server";

const VERIFY_URL = "https://api.gumroad.com/v2/licenses/verify";

export async function POST(req) {
  try {
    const { licenseKey } = await req.json();
    const productId = process.env.GUMROAD_PRODUCT_ID;

    if (!productId) {
      return NextResponse.json(
        { ok: false, error: "Missing GUMROAD_PRODUCT_ID on server." },
        { status: 500 }
      );
    }

    const key = (licenseKey || "").trim();
    if (key.length < 10) {
      return NextResponse.json(
        { ok: false, error: "Enter a valid Gumroad license key." },
        { status: 400 }
      );
    }

    const body = new URLSearchParams();
    body.set("product_id", productId);
    body.set("license_key", key);
    body.set("increment_uses_count", "false");

    const r = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });

    const data = await r.json();

    if (!data?.success) {
      return NextResponse.json(
        { ok: false, error: data?.message || "That license key is not valid." },
        { status: 401 }
      );
    }

    // Optional: return purchase info if you want it later
    return NextResponse.json({ ok: true, purchase: data.purchase || null });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Verification failed." },
      { status: 500 }
    );
  }
}
