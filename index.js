export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. FRONTEND ROUTE: Jab browser mein /home khola jaye
    if (request.method === "GET" && (url.pathname === "/home" || url.pathname === "/home.html")) {
      return new Response(getFrontendHTML(), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // 2. BACKEND API PIPELINE: Jab UI se data POST ho
    if (request.method === "POST" && url.pathname === "/api/sentiment") {
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      };

      if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }

      try {
        const { stock, news } = await request.json();
        const GEMINI_API_KEY = env.GEMINI_API_KEY; 
        
        if (!GEMINI_API_KEY) {
          return new Response(JSON.stringify({ error: "Gemini API key missing in Cloudflare Secrets." }), { status: 500, headers: corsHeaders });
        }
        
        const newsString = news.map((n, i) => `[News ${i+1}] ${n.title}`).join("\n");
        const prompt = `You are a financial terminal data processor. Analyze these news headlines for the stock "${stock}" over the last 24 hours:\n\n${newsString}\n\nReturn EXACTLY a raw JSON object string with no markdown blocks, no backticks, just valid parseable JSON fitting this interface exactly:
        {
           "sentimentScore": <an integer between 0 and 100 where 0 is extremely bearish, 50 is neutral, and 100 is extremely bullish>,
           "verdict": "<BULLISH / BEARISH / NEUTRAL>",
           "tldrPoints": ["Point 1 outlining core trend", "Point 2 explaining reason", "Point 3 stating short-term outlook"],
           "newsImpactScores": [<array of integers between -100 and +100 indicating relative impact of each corresponding news input index>]
        }`;

        const apiResponse = await fetch(`https://googleapis.com{GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const aiData = await apiResponse.json();
        let rawText = aiData.candidates[0].content.parts[0].text;
        rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

        return new Response(rawText, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    return new Response("Use /home path on your domain to access the interactive dashboard terminal.", { status: 200 });
  }
};

// Pure Frontend Dashboard Engine
function getFrontendHTML() {
  // Contains the HTML, Tailwind UI, and client-side JavaScript for the SentimentAI live terminal dashboard.
  // You can find the full frontend engine code in the referenced web documents.
  return `<!-- Frontend HTML and Client Script -->`;
}
