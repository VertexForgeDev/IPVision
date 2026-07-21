// api/index.js
export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const ip = url.searchParams.get('ip') || '';

    // RapidAPI target details
    const RAPIDAPI_HOST = 'ip-location5.p.rapidapi.com';
    const targetUrl = `https://${RAPIDAPI_HOST}/get_ip_info?ip=${encodeURIComponent(ip)}`;

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'x-rapidapi-key': env.RAPIDAPI_KEY, // Secret from Cloudflare
          'x-rapidapi-host': RAPIDAPI_HOST,
        },
      });

      const data = await response.text();
      return new Response(data, {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Proxy request failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
