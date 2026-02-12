// app/api/license/route.js (for Next.js 13+ App Router)
// OR pages/api/license.js (for Next.js Pages Router)

export async function POST(req) {
  try {
    const { licenseKey } = await req.json();

    if (!licenseKey) {
      return Response.json({ ok: false, error: "License key required" }, { status: 400 });
    }

    // Your Gumroad product ID from environment variables
    const GUMROAD_PRODUCT_ID = process.env.GUMROAD_PRODUCT_ID;

    if (!GUMROAD_PRODUCT_ID) {
      console.error("GUMROAD_PRODUCT_ID not set in environment variables");
      return Response.json({ ok: false, error: "Server configuration error" }, { status: 500 });
    }

    // Verify with Gumroad
    const response = await fetch("https://api.gumroad.com/v2/licenses/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        product_id: GUMROAD_PRODUCT_ID,
        license_key: licenseKey.trim(),
        increment_uses_count: "false",
      }),
    });

    const data = await response.json();

    console.log("Gumroad response:", data); // Debug logging

    if (data.success && data.purchase) {
      // License is valid - store in session/cookie
      return Response.json({ 
        ok: true, 
        purchase: data.purchase 
      });
    } else {
      // License is invalid
      return Response.json({ 
        ok: false, 
        error: "Invalid license key",
        gumroad: data 
      }, { status: 400 });
    }

  } catch (error) {
    console.error("License verification error:", error);
    return Response.json({ 
      ok: false, 
      error: "Verification failed" 
    }, { status: 500 });
  }
}
