// Save this as: /api/license.js (at root level, NOT in /src)

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log("✅ License verification endpoint hit");
  
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { licenseKey } = req.body;

    if (!licenseKey) {
      console.error("❌ No license key provided");
      return res.status(400).json({ ok: false, error: "License key required" });
    }

    const GUMROAD_PRODUCT_ID = process.env.GUMROAD_PRODUCT_ID;
    
    if (!GUMROAD_PRODUCT_ID) {
      console.error("❌ GUMROAD_PRODUCT_ID environment variable not set!");
      return res.status(500).json({ 
        ok: false, 
        error: "Server configuration error - contact support" 
      });
    }

    console.log("🔍 Verifying license with Gumroad...");
    
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
    console.log("📦 Gumroad response:", JSON.stringify(data, null, 2));

    if (data.success && data.purchase) {
      console.log("✅ License valid!");
      return res.status(200).json({ 
        ok: true, 
        purchase: data.purchase 
      });
    } else {
      console.log("❌ License invalid:", data.message);
      return res.status(400).json({ 
        ok: false, 
        error: "Invalid license key",
        gumroad: data 
      });
    }

  } catch (error) {
    console.error("💥 License verification error:", error);
    return res.status(500).json({ 
      ok: false, 
      error: error.message || "Verification failed" 
    });
  }
}
