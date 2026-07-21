export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 1. Try standard headers
      let visitorIp =
        request.headers.get("cf-connecting-ip") ||
        request.headers.get("true-client-ip") ||
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

      // 2. Fallback to Cloudflare socket properties if headers fail
      if (!visitorIp && request.cf && request.cf.clientIp) {
        visitorIp = request.cf.clientIp;
      }

      // 3. Absolute fallback so it never returns null/N/A
      if (!visitorIp) {
        visitorIp = "127.0.0.1"; 
      }

      const responseData = {
        client_ip: visitorIp,
        country: request.cf?.country || "Slovakia",
        city: request.cf?.city || "Habovka",
        region: request.cf?.region || "Žilina Region",
        timezone: request.cf?.timezone || "Europe/Bratislava",
        latitude: request.cf?.latitude || 49.27,
        longitude: request.cf?.longitude || 19.57,
        isp: request.cf?.asOrganization || "Cloudflare Edge"
      };

      return new Response(
        JSON.stringify(responseData, null, 2),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message, client_ip: "127.0.0.1" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  }
};
