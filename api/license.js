// /api/license.js - For React apps on Vercel

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log("=== LICENSE VERIFICATION DEBUG ===");
  
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { licenseKey } = req.body;
    const productId = process.env.GUMROAD_PRODUCT_ID;

    console.log("1. License Key received:", licenseKey);
    console.log("2. Product ID from env:", productId);

    if (!productId) {
      console.error("ERROR: GUMROAD_PRODUCT_ID not set!");
      return res.status(500).json({
        ok: false,
        error: "Server config error: Missing product ID"
      });
    }

    if (!licenseKey || licenseKey.trim().length < 10) {
      console.error("ERROR: Invalid license key format");
      return res.status(400).json({
        ok: false,
        error: "Please enter a valid license key"
      });
    }

    // Prepare request to Gumroad
    const formBody = new URLSearchParams();
    formBody.set("product_id", productId);
    formBody.set("license_key", licenseKey.trim());
    formBody.set("increment_uses_count", "false");

    console.log("3. Sending to Gumroad:");
    console.log("   - product_id:", productId);
    console.log("   - license_key:", licenseKey.trim());

    // Call Gumroad API
    const response = await fetch("https://api.gumroad.com/v2/licenses/verify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });

    const data = await response.json();
    
    console.log("4. Gumroad Response:", JSON.stringify(data, null, 2));
    console.log("5. Success?", data.success);
    
    if (!data.success) {
      console.log("FAILED - Gumroad rejected the license");
      return res.status(401).json({
        ok: false,
        error: data.message || "Invalid license key",
        gumroad: data
      });
    }

    console.log("SUCCESS - License is valid!");
    return res.status(200).json({
      ok: true,
      purchase: data.purchase
    });

  } catch (error) {
    console.error("EXCEPTION:", error);
    return res.status(500).json({
      ok: false,
      error: "Server error: " + error.message
    });
  }
}
