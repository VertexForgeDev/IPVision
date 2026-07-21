export default {
  async fetch(request, env) {
    // 1. Handle CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // 2. Parse Requested Target IP
    const url = new URL(request.url);
    let targetIp = url.searchParams.get("ip") || "";

    // Clear empty strings or invalid default text ('self', 'null', 'undefined')
    const invalidValues = ["self", "undefined", "null"];
    if (!targetIp || invalidValues.includes(targetIp.trim().toLowerCase())) {
      targetIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "";
    }

    // Sanitize IPv6 brackets & whitespace
    targetIp = targetIp.replace(/^\[|\]$/g, "").trim();

    // 3. Verify RapidAPI Key
    const apiKey = env?.RAPIDAPI || globalThis?.RAPIDAPI;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "RAPIDAPI secret key is missing in Cloudflare Worker settings." }),
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    try {
      // 4. Always pass `?ip=` parameter to RapidAPI so root requests don't return 404
      const upstreamUrl = targetIp
        ? `https://ip-geolocation-ipwhois-io.p.rapidapi.com/json/?ip=${encodeURIComponent(targetIp)}`
        : `https://ip-geolocation-ipwhois-io.p.rapidapi.com/json/?ip=`;

      const upstreamResponse = await fetch(upstreamUrl, {
        method: "GET",
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "ip-geolocation-ipwhois-io.p.rapidapi.com",
        },
      });

      const data = await upstreamResponse.json();

      return new Response(JSON.stringify(data), {
        status: upstreamResponse.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Worker Gateway Error: " + err.message }),
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }
  },
};
