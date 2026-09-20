export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    try {
      // ==========================================
      // FRONTEND
      // ==========================================

      if (
        url.pathname === "/" ||
        url.pathname === "/home" ||
        url.pathname === "/home.html"
      ) {
        return new Response(
          `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SinSigma SentimentAI</title>

  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 900px;
      margin: 40px auto;
      padding: 20px;
      background: #f5f5f5;
    }

    .box {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,.08);
    }

    input {
      padding: 12px;
      width: 250px;
      font-size: 16px;
    }

    button {
      padding: 12px 20px;
      font-size: 16px;
      cursor: pointer;
    }

    pre {
      white-space: pre-wrap;
      word-break: break-word;
      background: #111;
      color: #0f0;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
    }
  </style>
</head>

<body>

  <div class="box">
    <h1>SinSigma SentimentAI</h1>

    <p>News API diagnostic mode</p>

    <input
      id="stock"
      value="RELIANCE"
      placeholder="Stock symbol"
    />

    <button onclick="testNews()">
      Test News API
    </button>

    <pre id="result">Ready...</pre>
  </div>

<script>
async function testNews() {

  const stock =
    document.getElementById("stock").value.trim() || "RELIANCE";

  const result =
    document.getElementById("result");

  result.textContent =
    "Testing /api/news for " + stock + "...";

  try {

    const response = await fetch(
      "/api/news?stock=" +
      encodeURIComponent(stock)
    );

    const text =
      await response.text();

    result.textContent =
      "HTTP STATUS: " +
      response.status +
      "\\n\\n" +
      text;

  } catch (error) {

    result.textContent =
      "FRONTEND ERROR:\\n" +
      error.message;
  }
}
</script>

</body>
</html>`,
          {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=UTF-8"
            }
          }
        );
      }


      // ==========================================
      // NEWS API
      // ==========================================

      if (
        url.pathname === "/api/news" &&
        request.method === "GET"
      ) {

        const stock =
          url.searchParams.get("stock") || "RELIANCE";

        const news =
          await fetchLiveNews(stock, env);

        return new Response(
          JSON.stringify(
            {
              success: true,
              stock,
              news
            },
            null,
            2
          ),
          {
            status: 200,
            headers: corsHeaders
          }
        );
      }


      // ==========================================
      // SENTIMENT
      // ==========================================

      if (
        url.pathname === "/api/sentiment" &&
        request.method === "POST"
      ) {

        return jsonResponse(
          {
            error:
              "Gemini is temporarily disabled while NEWS_API_KEY is being diagnosed."
          },
          503,
          corsHeaders
        );
      }


      // ==========================================
      // UNKNOWN ROUTE
      // ==========================================

      return jsonResponse(
        {
          error: "Route not found",
          path: url.pathname,
          method: request.method
        },
        404,
        corsHeaders
      );

    } catch (error) {

      console.error(
        "WORKER ERROR:",
        error
      );

      return jsonResponse(
        {
          success: false,
          diagnostic: true,
          error:
            error.message ||
            String(error)
        },
        500,
        corsHeaders
      );
    }
  }
};


// =================================================
// FETCH LIVE NEWS
// =================================================

async function fetchLiveNews(stock, env) {

  // ==========================================
  // STEP 1 — NORMAL CLOUDFLARE SECRET
  // ==========================================

  const NEWS_API_KEY =
    env.NEWS_API_KEY;


  // ==========================================
  // STEP 2 — CHECK SECRET
  // ==========================================

  if (!NEWS_API_KEY) {

    throw new Error(
      "NEWS_API_KEY Worker Secret is missing. Go to Cloudflare → Worker → Settings → Variables and Secrets and add NEWS_API_KEY as a Secret."
    );
  }


  // ==========================================
  // STEP 3 — BUILD NEWSAPI URL
  // ==========================================

  const query =
    encodeURIComponent(stock);

  const newsUrl =
    "https://newsapi.org/v2/everything" +
    "?q=" +
    query +
    "&language=en" +
    "&sortBy=publishedAt" +
    "&pageSize=5";


  // ==========================================
  // STEP 4 — CALL NEWSAPI
  // ==========================================

  let response;

  try {

    response =
      await fetch(
        newsUrl,
        {
          method: "GET",

          headers: {
            "X-Api-Key": NEWS_API_KEY,
            "Accept": "application/json"
          }
        }
      );

  } catch (error) {

    throw new Error(
      "Could not connect to NewsAPI: " +
      (
        error.message ||
        String(error)
      )
    );
  }


  // ==========================================
  // STEP 5 — READ RESPONSE
  // ==========================================

  const responseText =
    await response.text();


  // ==========================================
  // STEP 6 — PARSE JSON
  // ==========================================

  let data;

  try {

    data =
      JSON.parse(responseText);

  } catch {

    throw new Error(
      "NewsAPI returned a non-JSON response. HTTP " +
      response.status +
      ". Response: " +
      responseText.substring(0, 500)
    );
  }


  // ==========================================
  // STEP 7 — NEWSAPI ERROR
  // ==========================================

  if (!response.ok) {

    throw new Error(
      "NewsAPI rejected the request. HTTP " +
      response.status +
      ". " +
      (
        data &&
        data.message
          ? data.message
          : responseText
      )
    );
  }


  // ==========================================
  // STEP 8 — CHECK ARTICLES
  // ==========================================

  if (
    !data ||
    !Array.isArray(data.articles)
  ) {

    throw new Error(
      "NewsAPI response does not contain an articles array."
    );
  }


  // ==========================================
  // STEP 9 — RETURN NEWS
  // ==========================================

  return data.articles.map(
    article => ({
      title:
        article.title || "",

      description:
        article.description || "",

      url:
        article.url || "",

      publishedAt:
        article.publishedAt || "",

      source:
        article.source &&
        article.source.name
          ? article.source.name
          : ""
    })
  );
}


// =================================================
// JSON RESPONSE
// =================================================

function jsonResponse(
  data,
  status = 200,
  extraHeaders = {}
) {

  return new Response(
    JSON.stringify(
      data,
      null,
      2
    ),
    {
      status,

      headers: {
        "Content-Type":
          "application/json",

        ...extraHeaders
      }
    }
  );
}
