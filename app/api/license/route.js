import { NextResponse } from "next/server";

const VERIFY_URL = "https://api.gumroad.com/v2/licenses/verify";

export async function POST(req) {
  console.log("🔐 License verification endpoint hit");
  
  try {
    const { licenseKey } = await req.json();
    const productId = process.env.GUMROAD_PRODUCT_ID;

    console.log("Product ID:", productId ? "✅ Found" : "❌ Missing");

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

    console.log("🔍 Calling Gumroad API...");

    const r = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });

    const data = await r.json();
    console.log("📦 Gumroad response:", JSON.stringify(data, null, 2));

    if (!data?.success) {
      // Pass the full Gumroad response back to the frontend
      return NextResponse.json(
        { 
          ok: false, 
          error: data?.message || "That license key is not valid.",
          gumroad: data // Include full Gumroad response for debugging
        },
        { status: 401 }
      );
    }

    console.log("✅ License valid!");
    return NextResponse.json({ ok: true, purchase: data.purchase || null });
  } catch (err) {
    console.error("💥 Error:", err);
    return NextResponse.json(
      { ok: false, error: "Verification failed." },
      { status: 500 }
    );
  }
}
