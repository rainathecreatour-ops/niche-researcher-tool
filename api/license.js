// Save this as: /api/license.js (Vercel Serverless Function) OR /pages/api/license.js (Next.js Pages Router)
//
// This verifies a Gumroad license key against your product permalink.
//
// Required env var on Vercel:
// - GUMROAD_PRODUCT_PERMALINK

export default async function handler(req, res) {
  // CORS (safe for public license verification endpoint)
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Requested-With, Accept, Accept-Version, Content-Length, Date"
  );

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    // Vercel/Next may provide req.body as object or string depending on runtime/config.
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : (req.body || {});

    const licenseKey = (body.licenseKey || body.license_key || "").toString().trim();
    if (!licenseKey) return res.status(400).json({ ok: false, error: "License key required" });

    const productPermalink = (process.env.GUMROAD_PRODUCT_PERMALINK || "").toString().trim();
    if (!productPermalink) {
      return res.status(500).json({
        ok: false,
        error: "Server configuration error: GUMROAD_PRODUCT_PERMALINK is not set",
      });
    }

    const gumroadRes = await fetch("https://api.gumroad.com/v2/licenses/verify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        product_permalink: productPermalink,
        license_key: licenseKey,
        // Keep this false so simply checking doesn't consume/lock activations.
        increment_uses_count: "false",
      }),
    });

    const gumroadData = await gumroadRes.json().catch(() => ({}));

    // Gumroad returns { success: boolean, message?: string, purchase?: {...} }
    if (gumroadData?.success && gumroadData?.purchase) {
      const purchase = gumroadData.purchase;

      // Optional safety checks (won't break valid licenses):
      // If Gumroad marks refunded/chargebacked/disputed, treat as invalid access.
      const refunded = Boolean(purchase.refunded);
      const chargebacked = Boolean(purchase.chargebacked);
      const disputed = Boolean(purchase.disputed);

      if (refunded || chargebacked || disputed) {
        return res.status(403).json({
          ok: false,
          error: "This purchase is no longer active.",
          gumroad: gumroadData,
        });
      }

      return res.status(200).json({ ok: true, purchase });
    }

    return res.status(400).json({
      ok: false,
      error: gumroadData?.message || "Invalid license key",
      gumroad: gumroadData,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Verification failed",
    });
  }
}
