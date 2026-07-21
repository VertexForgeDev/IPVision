export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const url = new URL(request.url);
    let targetIp = url.searchParams.get("ip") || "";

    const invalidValues = ["self", "undefined", "null"];
    if (!targetIp || invalidValues.includes(targetIp.trim().toLowerCase())) {
      // Check multiple standard headers to catch the true user IP reliably
      const forwardedFor = request.headers.get("x-forwarded-for");
      targetIp = request.headers.get("cf-connecting-ip") || 
                 request.headers.get("true-client-ip") || 
                 (forwardedFor ? forwardedFor.split(',')[0].trim() : "") || 
                 request.headers.get("x-real-ip") || 
                 "";
    }

    targetIp = targetIp.replace(/^\[|\]$/g, "").trim();

    const apiKey = env?.RAPIDAPI || globalThis?.RAPIDAPI;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "RAPIDAPI key is missing in Cloudflare Worker settings." }),
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    try {
      const upstreamUrl = targetIp
        ? `https://ip-geolocation-ipwhois-io.p.rapidapi.com/json/?ip=${encodeURIComponent(targetIp)}`
        : `https://ip-geolocation-ipwhois-io.p.rapidapi.com/json/`;

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
