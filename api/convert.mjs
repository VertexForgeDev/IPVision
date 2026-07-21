// api/convert.mjs

export default {
  /**
   * Main fetch handler for Cloudflare Worker
   * @param {Request} request 
   * @param {Object} env Environment bindings containing env.RAPIDAPI
   */
  async fetch(request, env) {
    // 1. Define CORS headers for client access
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // 2. Handle preflight CORS request
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 3. Extract and clean target IP parameter
    const url = new URL(request.url);
    let targetIp = url.searchParams.get('ip') || '';

    // Extract real client static/public IP if blank or 'self'
    if (!targetIp || ['self', 'undefined', 'null'].includes(targetIp.trim().toLowerCase())) {
      targetIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || '';
    }

    targetIp = targetIp.replace(/^\[|\]$/g, '').trim();

    // 4. Validate API key environment binding
    const apiKey = env?.RAPIDAPI || globalThis?.RAPIDAPI;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: RAPIDAPI key is missing in Worker settings.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Correct RapidAPI Endpoint (Matches script.js structure)
    const RAPIDAPI_HOST = 'ip-geolocation-ipwhois-io.p.rapidapi.com';
    const targetUrl = targetIp
      ? `https://${RAPIDAPI_HOST}/json/?ip=${encodeURIComponent(targetIp)}`
      : `https://${RAPIDAPI_HOST}/json/`;

    try {
      // 6. Proxy request to RapidAPI with secret key
      const apiResponse = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': RAPIDAPI_HOST,
        },
      });

      const data = await apiResponse.json();

      // 7. Return response to frontend
      return new Response(JSON.stringify(data), {
        status: apiResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Internal proxy error', details: err.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  },
};
