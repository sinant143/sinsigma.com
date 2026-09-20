export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. FRONTEND ROUTE: /home par user interface dikhana
    if (request.method === "GET" && (url.pathname === "/home" || url.pathname === "/home.html")) {
      return new Response(getFrontendHTML(), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // 2. BACKEND API PIPELINE: Sentiment processing handle karna
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
        
        // NEW FIX: Cloudflare central store se secure key fetch karna
        let GEMINI_API_KEY = "";
        try {
          GEMINI_API_KEY = await env.GEMINI_KEY.get(); 
        } catch (e) {
          // Fallback proxy binding mapping check
          GEMINI_API_KEY = env.GEMINI_KEY || "";
        }
        
        if (!GEMINI_API_KEY) {
          return new Response(JSON.stringify({ error: "Gemini API key missing in Cloudflare Secrets Store orchestration." }), { status: 500, headers: corsHeaders });
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
        let rawText = aiData.candidates.content.parts.text;
        rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

        return new Response(rawText, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    return new Response("Use /home path on your domain to access the interactive dashboard terminal.", { status: 200 });
  }
};

// Pure Frontend Dashboard Engine Blueprint
function getFrontendHTML() {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SentimentAI - Live Stock News Sentiment Terminal</title>
      <script src="https://tailwindcss.com"></script>
      <link rel="stylesheet" href="https://cloudflare.com">
      <style>
          .glow-green { text-shadow: 0 0 10px rgba(34, 197, 94, 0.5); }
          .glow-red { text-shadow: 0 0 10px rgba(239, 68, 68, 0.5); }
      </style>
  </head>
  <body class="bg-slate-950 text-slate-100 min-h-screen font-sans flex flex-col justify-between">
      <header class="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
          <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
              <div class="flex items-center space-x-2">
                  <i class="fa-solid fa-chart-line text-emerald-500 text-2xl"></i>
                  <span class="text-xl font-bold tracking-wider bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">SentimentAI</span>
              </div>
              <span class="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">Live Terminal</span>
          </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 py-8 flex-grow w-full">
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 shadow-xl">
              <div class="relative w-full">
                  <i class="fa-solid fa-magnifying-glass absolute left-4 top-4 text-slate-500"></i>
                  <input type="text" id="stockInput" placeholder="Enter Stock Name (e.g., TATA MOTORS, RELIANCE, ZOMATO)..." 
                      class="w-full bg-slate-950 border border-slate-700 rounded-lg pl-11 pr-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors">
              </div>
              <button onclick="analyzeStock()" class="w-full mt-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold py-3.5 px-6 rounded-lg transform hover:scale-[1.01] flex items-center justify-center space-x-2">
                  <i class="fa-solid fa-brain"></i><span>Analyze Live Sentiment</span>
              </button>
          </div>

          <div id="resultsDashboard" class="hidden grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div class="lg:col-span-2 space-y-8">
                  <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                      <h2 class="text-lg font-semibold text-slate-400 mb-4 self-start">Overall Market Sentiment</h2>
                      <div class="relative w-64 h-32 flex items-end justify-center overflow-hidden mb-4">
                          <div class="absolute w-64 h-64 rounded-full border-[16px] border-slate-800"></div>
                          <div class="absolute z-10 text-4xl font-extrabold" id="sentimentValue">0%</div>
                      </div>
                      <div class="text-2xl font-bold uppercase mt-2" id="sentimentLabel">Analyzing...</div>
                  </div>
                  <div class="bg-slate-900 border border-slate-800 rounded-xl p-6">
                      <h2 class="text-lg font-semibold text-slate-400 mb-3 flex items-center space-x-2">
                          <i class="fa-solid fa-wand-magic-sparkles text-cyan-400"></i><span>AI Summary (TL;DR)</span>
                      </h2>
                      <div id="aiSummary" class="space-y-3 text-slate-300 text-sm"></div>
                  </div>
              </div>
              <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 h-[500px] flex flex-col">
                  <h2 class="text-lg font-semibold text-slate-400 mb-3">Processed Live Feeds</h2>
                  <div id="newsFeed" class="space-y-4 overflow-y-auto flex-grow pr-1"></div>
              </div>
          </div>

          <div id="initialState" class="text-center py-20 text-slate-500">
              <i class="fa-solid fa-terminal text-6xl mb-4 opacity-30 block"></i><span>Enter a stock name or company name above to view analysis vectors.</span>
          </div>
          <div id="loadingState" class="hidden text-center py-20">
              <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
              <p class="text-lg text-slate-400">Fetching live Indian market news feeds and processing AI vectors...</p>
          </div>
      </main>

      <footer class="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-600">
          &copy; 2026 SentimentAI • 100% Serverless Cloudflare Architecture.
      </footer>

      <script>
          async function analyzeStock() {
              const stock = document.getElementById('stockInput').value.trim();
              if(!stock) return alert('Please enter a stock name');
              
              document.getElementById('initialState').classList.add('hidden');
              document.getElementById('resultsDashboard').classList.add('hidden');
              document.getElementById('loadingState').classList.remove('hidden');

              try {
                  const news = await fetchLiveNews(stock);
                  const res = await fetch('/api/sentiment', {
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ stock, news })
                  });
                  const aiResult = await res.json();
                  renderDashboard(aiResult, news);
              } catch(e) {
                  console.error(e);
                  alert('Error running analysis. Verify your Cloudflare secret key mappings.');
                  document.getElementById('initialState').classList.remove('hidden');
              } finally {
                  document.getElementById('loadingState').classList.add('hidden');
              }
          }

          async function fetchLiveNews(query) {
              const rssUrl = encodeURIComponent(\`https://google.com\${query}+stock+when:24h&hl=en-IN&gl=IN&ceid=IN:en\`);
              const response = await fetch(\`https://allorigins.win\${rssUrl}\`);
              const data = await response.json();
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(data.contents, "text/xml");
              const items = xmlDoc.getElementsByTagName("item");
let articles = [];for (let i = 0; i < Math.min(items.length, 5); i++) {if (items[i]) {const titleNode = items[i].getElementsByTagName("title")[0];const pubDateNode = items[i].getElementsByTagName("pubDate")[0];const linkNode = items[i].getElementsByTagName("link")[0];articles.push({title: titleNode ? titleNode.textContent : "Recent Update",pubDate: pubDateNode ? pubDateNode.textContent : "Just now",link: linkNode ? linkNode.textContent : "#"});}}if(articles.length === 0) {articles = [{ title: `Market tracks ${query} structural updates under close tracking parameters.`, pubDate: "Live Feed", link: "#" }];}return articles;}function renderDashboard(aiData, news) {document.getElementById("loadingState").classList.add("hidden");document.getElementById("resultsDashboard").classList.remove("hidden");document.getElementById("sentimentValue").innerText = `${aiData.sentimentScore}%`;document.getElementById("sentimentLabel").innerText = aiData.verdict;const labelEl = document.getElementById("sentimentLabel");labelEl.className = aiData.sentimentScore > 55 ? "text-2xl font-extrabold text-emerald-400 glow-green mt-2" : aiData.sentimentScore < 45 ? "text-2xl font-extrabold text-red-500 glow-red mt-2" : "text-2xl font-extrabold text-slate-400 mt-2";const summaryContainer = document.getElementById("aiSummary");summaryContainer.innerHTML = "";aiData.tldrPoints.forEach(point => {summaryContainer.innerHTML += `${point}`;});const feedContainer = document.getElementById("newsFeed");feedContainer.innerHTML = "";news.forEach((item, index) => {const score = aiData.newsImpactScores ? aiData.newsImpactScores[index] || 0 : 0;const badgeColor = score > 10 ? "bg-emerald-950/50 text-emerald-400 border-emerald-800" : score < -10 ? "bg-red-950/50 text-red-400 border-red-900" : "bg-slate-800 text-slate-400 border-slate-700";feedContainer.innerHTML += `${item.pubDate.substring(0,16)}Impact: ${score}${item.title}`;});}`;}
