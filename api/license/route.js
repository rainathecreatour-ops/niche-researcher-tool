// app/api/license/route.js (for App Router)
// OR pages/api/license.js (for Pages Router)

export async function POST(req) {
  console.log("License verification endpoint hit");
  
  try {
    const body = await req.json();
    console.log("Request body:", body);
    
    const { licenseKey } = body;

    if (!licenseKey) {
      return Response.json({ ok: false, error: "License key required" }, { status: 400 });
    }

    const GUMROAD_PRODUCT_ID = process.env.GUMROAD_PRODUCT_ID;
    console.log("Product ID from env:", GUMROAD_PRODUCT_ID ? "Found" : "Missing");

    if (!GUMROAD_PRODUCT_ID) {
      console.error("GUMROAD_PRODUCT_ID not set!");
      return Response.json({ ok: false, error: "Server configuration error" }, { status: 500 });
    }

    console.log("Calling Gumroad API...");
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
    console.log("Gumroad response:", data);

    if (data.success && data.purchase) {
      return Response.json({ 
        ok: true, 
        purchase: data.purchase 
      });
    } else {
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
      error: error.message || "Verification failed" 
    }, { status: 500 });
  }
}
