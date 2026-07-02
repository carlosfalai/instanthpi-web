// TRW affiliate sale postback receiver (Cloudflare Worker)
// POST /postback  — called by jointherealworld.com on every sale
//   params (query string or form body): a, subid, amount, type
// GET  /totals    — public JSON: number of sales + total dollars
// GET  /          — status
const AFFILIATE_ID = "ppntpkgfpp";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/postback") {
      const params = new URLSearchParams(url.search);
      const ct = request.headers.get("content-type") || "";
      if (ct.includes("form")) {
        const body = await request.formData().catch(() => null);
        if (body) for (const [k, v] of body.entries()) params.set(k, v);
      } else if (ct.includes("json")) {
        const body = await request.json().catch(() => null);
        if (body) for (const [k, v] of Object.entries(body)) params.set(k, String(v));
      }
      if (params.get("a") !== AFFILIATE_ID) {
        return new Response("wrong affiliate id", { status: 403 });
      }
      const rec = {
        ts: new Date().toISOString(),
        a: params.get("a"),
        subid: params.get("subid") || "",
        amount: parseFloat(params.get("amount") || "0") || 0,
        type: params.get("type") || "",
        ip: request.headers.get("cf-connecting-ip") || "",
      };
      const key = "sale:" + Date.now() + ":" + Math.random().toString(36).slice(2, 8);
      await env.TRW_SALES.put(key, JSON.stringify(rec));
      return new Response("ok", { status: 200 });
    }

    if (request.method === "GET" && url.pathname === "/totals") {
      let sales = 0, total = 0, cursor;
      do {
        const page = await env.TRW_SALES.list({ prefix: "sale:", cursor, limit: 1000 });
        cursor = page.list_complete ? null : page.cursor;
        for (const k of page.keys) {
          sales++;
          const v = await env.TRW_SALES.get(k.name, "json");
          if (v && v.amount) total += v.amount;
        }
      } while (cursor);
      return new Response(JSON.stringify({ sales, total_usd: Math.round(total * 100) / 100 }), {
        headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
      });
    }

    return new Response("TRW postback receiver up. POST /postback, GET /totals", { status: 200 });
  },
};
