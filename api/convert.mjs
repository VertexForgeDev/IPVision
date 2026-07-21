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

    // 3. Extract parameters from query string
    const url = new URL(request.url);
    const targetIp = url.searchParams.get('ip') || '';

    // 4. Validate API key environment binding
    if (!env.RAPIDAPI) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: RAPIDAPI key is missing.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // RapidAPI IP Location Endpoint Configuration
    const RAPIDAPI_HOST = 'ip-location5.p.rapidapi.com';
    const targetUrl = `https://${RAPIDAPI_HOST}/get_ip_info?ip=${encodeURIComponent(targetIp)}`;

    try {
      // 5. Proxy request to RapidAPI with secret key
      const apiResponse = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': env.RAPIDAPI,
          'x-rapidapi-host': RAPIDAPI_HOST,
        },
      });

      if (!apiResponse.ok) {
        return new Response(
          JSON.stringify({ error: `Upstream API error: ${apiResponse.statusText}` }),
          { status: apiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await apiResponse.json();

      // 6. Return response to frontend
      return new Response(JSON.stringify(data), {
        status: 200,
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
