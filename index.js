export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // ------------------------------------------------------------
    // CORS PREFLIGHT
    // ------------------------------------------------------------
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    // ------------------------------------------------------------
    // FRONTEND
    // ------------------------------------------------------------
    if (
      request.method === "GET" &&
      (url.pathname === "/" ||
        url.pathname === "/home" ||
        url.pathname === "/home.html")
    ) {
      return new Response(getFrontendHTML(), {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    // ------------------------------------------------------------
    // LIVE NEWS API
    // ------------------------------------------------------------
    if (request.method === "GET" && url.pathname === "/api/news") {
      try {
        const stock = url.searchParams.get("stock");

        if (!stock) {
          return new Response(
            JSON.stringify({
              error: "Stock name is required.",
            }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }

        const news = await fetchLiveNews(stock);

        return new Response(
          JSON.stringify({
            stock,
            news,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
          }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({
            error: err?.message || "Unable to fetch live news.",
          }),
          {
            status: 502,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    // ------------------------------------------------------------
    // SENTIMENT API
    // ------------------------------------------------------------
    if (request.method === "POST" && url.pathname === "/api/sentiment") {
      try {
        const { stock, news } = await request.json();

        if (!stock || !Array.isArray(news)) {
          return new Response(
            JSON.stringify({
              error: "Invalid request. Stock and news are required.",
            }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }

        // --------------------------------------------------------
        // CLOUDFLARE SECRETS STORE
        // --------------------------------------------------------
        if (
          !env.GEMINI_KEY ||
          typeof env.GEMINI_KEY.get !== "function"
        ) {
          return new Response(
            JSON.stringify({
              error:
                "GEMINI_KEY Secrets Store binding is missing. Please verify the GEMINI_KEY binding in Cloudflare.",
            }),
            {
              status: 500,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }

        const GEMINI_API_KEY = await env.GEMINI_KEY.get();

        if (!GEMINI_API_KEY) {
          return new Response(
            JSON.stringify({
              error: "GEMINI_KEY exists but returned an empty value.",
            }),
            {
              status: 500,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }

        // --------------------------------------------------------
        // PREPARE NEWS FOR GEMINI
        // --------------------------------------------------------
        const newsString = news
          .map(
            (n, i) =>
              `[News ${i + 1}]
Title: ${n.title}
Published: ${n.pubDate || "Unknown"}`
          )
          .join("\n\n");

        const prompt = `
You are a financial news sentiment processor.

Analyze the following recent news headlines for the stock/company:

"${stock}"

Recent news:

${newsString}

Your task is to determine the overall sentiment based ONLY on the supplied news.

Return ONLY valid JSON.
Do not use markdown.
Do not use code fences.
Do not add any explanation outside the JSON.

Required format:

{
  "sentimentScore": 75,
  "verdict": "BULLISH",
  "tldrPoints": [
    "Point one",
    "Point two",
    "Point three"
  ],
  "newsImpactScores": [20, 40, -10]
}

Rules:

1. sentimentScore must be an integer from 0 to 100.

2. verdict must be exactly one of:
"BULLISH"
"BEARISH"
"NEUTRAL"

3. tldrPoints must contain exactly 3 concise points.

4. newsImpactScores must contain exactly one integer for each news item.

5. newsImpactScores should normally range from -100 to 100.

6. Positive news should generally have positive impact.

7. Negative news should generally have negative impact.

8. Neutral or low-impact news should generally be close to 0.

9. Do not invent facts that are not present in the supplied news.

10. If the news is insufficient to determine a strong direction, use NEUTRAL.

11. The response must be valid JSON.
`;

        // --------------------------------------------------------
        // GEMINI API
        // --------------------------------------------------------
        const apiResponse = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": GEMINI_API_KEY,
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        const aiData = await apiResponse.json();

        // --------------------------------------------------------
        // GEMINI ERROR
        // --------------------------------------------------------
        if (!apiResponse.ok) {
          return new Response(
            JSON.stringify({
              error: "Gemini API request failed.",
              details: aiData,
            }),
            {
              status: apiResponse.status,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }

        // --------------------------------------------------------
        // EXTRACT GEMINI RESPONSE
        // --------------------------------------------------------
        const rawText =
          aiData?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
          return new Response(
            JSON.stringify({
              error: "Gemini returned an empty response.",
              details: aiData,
            }),
            {
              status: 502,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }

        // --------------------------------------------------------
        // PARSE JSON
        // --------------------------------------------------------
        let parsed;

        try {
          parsed = JSON.parse(rawText);
        } catch {
          return new Response(
            JSON.stringify({
              error: "Gemini returned invalid JSON.",
              raw: rawText,
            }),
            {
              status: 502,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }

        // --------------------------------------------------------
        // BASIC VALIDATION
        // --------------------------------------------------------
        if (
          typeof parsed.sentimentScore !== "number" ||
          !["BULLISH", "BEARISH", "NEUTRAL"].includes(
            parsed.verdict
          ) ||
          !Array.isArray(parsed.tldrPoints) ||
          !Array.isArray(parsed.newsImpactScores)
        ) {
          return new Response(
            JSON.stringify({
              error: "Gemini returned an unexpected response format.",
              data: parsed,
            }),
            {
              status: 502,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }

        // Keep score inside 0-100
        parsed.sentimentScore = Math.max(
          0,
          Math.min(100, Math.round(parsed.sentimentScore))
        );

        return new Response(JSON.stringify(parsed), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        });
      } catch (err) {
        return new Response(
          JSON.stringify({
            error: err?.message || "Unknown server error.",
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    // ------------------------------------------------------------
    // DEFAULT RESPONSE
    // ------------------------------------------------------------
    return new Response(
      "SinSigma SentimentAI — use /home to access the dashboard.",
      {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      }
    );
  },
};


// ============================================================
// LIVE GOOGLE NEWS FETCHER
// ============================================================

async function fetchLiveNews(query) {
  const googleNewsUrl =
    "https://news.google.com/rss/search?q=" +
    encodeURIComponent(query + " stock when:24h") +
    "&hl=en-IN&gl=IN&ceid=IN:en";

  const response = await fetch(googleNewsUrl, {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; SinSigma-SentimentAI/1.0)",
      "Accept": "application/rss+xml, application/xml, text/xml",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Google News request failed with status ${response.status}.`
    );
  }

  const xmlText = await response.text();

  if (!xmlText || xmlText.length < 100) {
    throw new Error("Google News returned an empty response.");
  }

  const items = xmlText.match(/<item[\s\S]*?<\/item>/gi) || [];

  const articles = [];

  for (let i = 0; i < Math.min(items.length, 5); i++) {
    const item = items[i];

    const title =
      extractXmlValue(item, "title") ||
      "Recent market update";

    const pubDate =
      extractXmlValue(item, "pubDate") ||
      "Recent";

    const link =
      extractXmlValue(item, "link") ||
      "#";

    const source =
      extractXmlValue(item, "source") ||
      "Google News";

    articles.push({
      title: cleanXmlText(title),
      pubDate: cleanXmlText(pubDate),
      link: cleanXmlText(link),
      source: cleanXmlText(source),
    });
  }

  if (articles.length === 0) {
    articles.push({
      title: "No recent news found for this company.",
      pubDate: "Live Feed",
      link: "#",
      source: "Google News",
    });
  }

  return articles;
}


// ============================================================
// XML HELPERS
// ============================================================

function extractXmlValue(xml, tag) {
  const regex = new RegExp(
    `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
    "i"
  );

  const match = xml.match(regex);

  return match ? match[1].trim() : "";
}


function cleanXmlText(value) {
  return value
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}


// ============================================================
// FRONTEND
// ============================================================

function getFrontendHTML() {
  return `
<!DOCTYPE html>
<html lang="en">

<head>

  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>SinSigma SentimentAI</title>

  <script src="https://cdn.tailwindcss.com"></script>

  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
  >

  <style>

    .glow-green {
      text-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
    }

    .glow-red {
      text-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
    }

  </style>

</head>


<body
  class="bg-slate-950 text-slate-100 min-h-screen font-sans flex flex-col"
>


<!-- =========================================================
     HEADER
========================================================= -->

<header
  class="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50"
>

  <div
    class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"
  >

    <div class="flex items-center space-x-2">

      <i
        class="fa-solid fa-chart-line text-emerald-500 text-2xl"
      ></i>

      <span
        class="text-xl font-bold tracking-wider bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent"
      >
        SinSigma
      </span>

    </div>


    <span
      class="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700"
    >
      SentimentAI
    </span>

  </div>

</header>


<!-- =========================================================
     MAIN
========================================================= -->

<main
  class="max-w-7xl mx-auto px-4 py-8 flex-grow w-full"
>


<!-- =========================================================
     SEARCH
========================================================= -->

<div
  class="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 shadow-xl"
>

  <div class="relative w-full">

    <i
      class="fa-solid fa-magnifying-glass absolute left-4 top-4 text-slate-500"
    ></i>

    <input
      type="text"
      id="stockInput"
      placeholder="Enter stock name e.g. TATA MOTORS, RELIANCE, ZOMATO..."
      class="w-full bg-slate-950 border border-slate-700 rounded-lg pl-11 pr-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
      onkeydown="if(event.key === 'Enter') analyzeStock()"
    >

  </div>


  <button
    id="analyzeButton"
    onclick="analyzeStock()"
    class="w-full mt-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold py-3.5 px-6 rounded-lg hover:scale-[1.01] transition"
  >

    <i class="fa-solid fa-brain"></i>

    <span class="ml-2">
      Analyze Live Sentiment
    </span>

  </button>

</div>


<!-- =========================================================
     LOADING
========================================================= -->

<div
  id="loadingState"
  class="hidden text-center py-20"
>

  <div
    class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500 mb-4"
  ></div>

  <p class="text-lg text-slate-400">
    Fetching live news and processing AI sentiment...
  </p>

</div>


<!-- =========================================================
     RESULTS
========================================================= -->

<div
  id="resultsDashboard"
  class="hidden grid grid-cols-1 lg:grid-cols-3 gap-8"
>


  <!-- LEFT -->

  <div class="lg:col-span-2 space-y-8">


    <!-- SCORE -->

    <div
      class="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center"
    >

      <h2
        class="text-lg font-semibold text-slate-400 mb-6"
      >
        Overall Market Sentiment
      </h2>


      <div
        class="text-6xl font-extrabold"
        id="sentimentValue"
      >
        0%
      </div>


      <div
        class="text-2xl font-bold uppercase mt-4"
        id="sentimentLabel"
      >
        ANALYZING...
      </div>

    </div>


    <!-- SUMMARY -->

    <div
      class="bg-slate-900 border border-slate-800 rounded-xl p-6"
    >

      <h2
        class="text-lg font-semibold text-slate-400 mb-4"
      >

        <i
          class="fa-solid fa-wand-magic-sparkles text-cyan-400 mr-2"
        ></i>

        AI Summary

      </h2>


      <div
        id="aiSummary"
        class="space-y-3 text-slate-300 text-sm"
      ></div>

    </div>

  </div>


  <!-- =======================================================
       NEWS
  ======================================================== -->

  <div
    class="bg-slate-900 border border-slate-800 rounded-xl p-6 h-[500px] flex flex-col"
  >

    <h2
      class="text-lg font-semibold text-slate-400 mb-3"
    >
      Processed Live Feeds
    </h2>


    <div
      id="newsFeed"
      class="space-y-4 overflow-y-auto flex-grow pr-1"
    ></div>

  </div>

</div>


<!-- =========================================================
     INITIAL
========================================================= -->

<div
  id="initialState"
  class="text-center py-20 text-slate-500"
>

  <i
    class="fa-solid fa-terminal text-6xl mb-4 opacity-30 block"
  ></i>

  <span>
    Enter a stock name or company name above to view analysis.
  </span>

</div>


<!-- =========================================================
     ERROR
========================================================= -->

<div
  id="errorState"
  class="hidden text-center py-10"
>

  <div
    class="bg-red-950/30 border border-red-900 rounded-xl p-6 max-w-2xl mx-auto"
  >

    <i
      class="fa-solid fa-circle-exclamation text-red-400 text-3xl mb-3"
    ></i>


    <p
      id="errorMessage"
      class="text-red-300"
    ></p>

  </div>

</div>


</main>


<!-- =========================================================
     FOOTER
========================================================= -->

<footer
  class="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-600"
>

  &copy; 2026 SinSigma • Technology & Cybersecurity

</footer>


<!-- =========================================================
     FRONTEND JAVASCRIPT
========================================================= -->

<script>

async function analyzeStock() {

  const stock =
    document.getElementById("stockInput").value.trim();


  if (!stock) {

    alert("Please enter a stock name.");

    return;

  }


  const initial =
    document.getElementById("initialState");


  const results =
    document.getElementById("resultsDashboard");


  const loading =
    document.getElementById("loadingState");


  const errorState =
    document.getElementById("errorState");


  const button =
    document.getElementById("analyzeButton");


  initial.classList.add("hidden");

  results.classList.add("hidden");

  errorState.classList.add("hidden");

  loading.classList.remove("hidden");

  button.disabled = true;

  button.classList.add("opacity-60", "cursor-not-allowed");


  try {

    // --------------------------------------------------------
    // STEP 1: FETCH LIVE NEWS FROM OUR CLOUDFLARE WORKER
    // --------------------------------------------------------

    const newsResponse =
      await fetch(
        "/api/news?stock=" +
        encodeURIComponent(stock)
      );


    const newsData =
      await newsResponse.json();


    if (!newsResponse.ok) {

      throw new Error(
        newsData.error ||
        "Unable to fetch live news."
      );

    }


    const news =
      newsData.news || [];


    if (!news.length) {

      throw new Error(
        "No recent news found for this company."
      );

    }


    // --------------------------------------------------------
    // STEP 2: SEND NEWS TO GEMINI
    // --------------------------------------------------------

    const sentimentResponse =
      await fetch("/api/sentiment", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          stock,
          news
        })

      });


    const aiResult =
      await sentimentResponse.json();


    if (!sentimentResponse.ok) {

      const geminiMessage =
        aiResult.details?.error?.message;


      throw new Error(
        aiResult.error ||
        geminiMessage ||
        "Sentiment API failed."
      );

    }


    // --------------------------------------------------------
    // STEP 3: DISPLAY RESULTS
    // --------------------------------------------------------

    renderDashboard(
      aiResult,
      news,
      stock
    );


  } catch (error) {

    console.error(error);

    errorState.classList.remove("hidden");

    document.getElementById(
      "errorMessage"
    ).innerText =
      error.message ||
      "Unable to complete analysis.";


  } finally {

    loading.classList.add("hidden");

    button.disabled = false;

    button.classList.remove(
      "opacity-60",
      "cursor-not-allowed"
    );

  }

}


// ============================================================
// RENDER DASHBOARD
// ============================================================

function renderDashboard(
  aiData,
  news,
  stock
) {

  document
    .getElementById("resultsDashboard")
    .classList.remove("hidden");


  // ----------------------------------------------------------
  // SCORE
  // ----------------------------------------------------------

  const score =
    Number(aiData.sentimentScore) || 0;


  document
    .getElementById("sentimentValue")
    .innerText =
      score + "%";


  // ----------------------------------------------------------
  // VERDICT
  // ----------------------------------------------------------

  const labelEl =
    document.getElementById("sentimentLabel");


  const verdict =
    aiData.verdict || "NEUTRAL";


  labelEl.innerText =
    verdict;


  if (score > 55) {

    labelEl.className =
      "text-2xl font-extrabold text-emerald-400 glow-green mt-4";

  } else if (score < 45) {

    labelEl.className =
      "text-2xl font-extrabold text-red-500 glow-red mt-4";

  } else {

    labelEl.className =
      "text-2xl font-extrabold text-slate-400 mt-4";

  }


  // ----------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------

  const summaryContainer =
    document.getElementById("aiSummary");


  summaryContainer.innerHTML = "";


  const points =
    Array.isArray(aiData.tldrPoints)
      ? aiData.tldrPoints
      : [];


  points.forEach(point => {

    const div =
      document.createElement("div");


    div.className =
      "flex items-start space-x-2 border-l-2 border-slate-700 pl-3 py-1";


    const icon =
      document.createElement("i");


    icon.className =
      "fa-solid fa-chevron-right text-xs text-emerald-500 mt-1";


    const span =
      document.createElement("span");


    span.textContent =
      point;


    div.appendChild(icon);

    div.appendChild(span);

    summaryContainer.appendChild(div);

  });


  // ----------------------------------------------------------
  // NEWS FEED
  // ----------------------------------------------------------

  const feedContainer =
    document.getElementById("newsFeed");


  feedContainer.innerHTML = "";


  news.forEach((item, index) => {

    const score =
      Number(
        aiData.newsImpactScores?.[index] ?? 0
      );


    const article =
      document.createElement("div");


    article.className =
      "bg-slate-950 p-4 rounded-lg border border-slate-800 mb-3";


    // DATE + IMPACT

    const meta =
      document.createElement("div");


    meta.className =
      "flex justify-between items-start mb-2";


    const date =
      document.createElement("span");


    date.className =
      "text-[10px] text-slate-500";


    date.textContent =
      String(
        item.pubDate || "Recent"
      ).substring(0, 28);


    const impact =
      document.createElement("span");


    impact.className =
      "text-[10px] font-bold px-2 py-0.5 rounded border";


    if (score > 10) {

      impact.className +=
        " bg-emerald-950/50 text-emerald-400 border-emerald-800";

    } else if (score < -10) {

      impact.className +=
        " bg-red-950/50 text-red-400 border-red-900";

    } else {

      impact.className +=
        " bg-slate-800 text-slate-400 border-slate-700";

    }


    impact.textContent =
      "Impact: " + score;


    meta.appendChild(date);

    meta.appendChild(impact);


    // TITLE

    const title =
      document.createElement("a");


    title.href =
      item.link || "#";


    title.target =
      "_blank";


    title.rel =
      "noopener noreferrer";


    title.className =
      "text-sm text-slate-200 block leading-snug hover:text-emerald-400";


    title.textContent =
      item.title || "News update";


    article.appendChild(meta);

    article.appendChild(title);


    // SOURCE

    if (item.source) {

      const source =
        document.createElement("div");


      source.className =
        "text-[10px] text-slate-600 mt-2";


      source.textContent =
        item.source;


      article.appendChild(source);

    }


    feedContainer.appendChild(article);

  });

}

</script>


</body>

</html>
`;
}
