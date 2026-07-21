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
      const visitorIp =
        request.headers.get("cf-connecting-ip") ||
        request.headers.get("true-client-ip") ||
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

      return new Response(
        JSON.stringify({
          client_ip: visitorIp,
          country: request.cf?.country || null,
          city: request.cf?.city || null,
          region: request.cf?.region || null,
          timezone: request.cf?.timezone || null,
          latitude: request.cf?.latitude || null,
          longitude: request.cf?.longitude || null,
          isp: request.cf?.asOrganization || null
        }, null, 2),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } catch(error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  }
};
