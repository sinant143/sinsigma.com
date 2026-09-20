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
      // ================================
      // FRONTEND
      // ================================
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

    <p>
      Diagnostic mode
    </p>

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

    const text = await response.text();

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

      // ================================
      // NEWS API DIAGNOSTIC
      // ================================
      if (
        url.pathname === "/api/news" &&
        request.method === "GET"
      ) {
        const stock =
          url.searchParams.get("stock") || "RELIANCE";

        const result =
          await fetchLiveNews(stock, env);

        return new Response(
          JSON.stringify(
            {
              success: true,
              stock,
              news: result
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

      // ================================
      // SENTIMENT
      // ================================
      if (
        url.pathname === "/api/sentiment" &&
        request.method === "POST"
      ) {
        return jsonResponse(
          {
            error:
              "Gemini diagnostic is temporarily disabled. First verify /api/news."
          },
          503,
          corsHeaders
        );
      }

      // ================================
      // UNKNOWN ROUTE
      // ================================
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
      console.error("WORKER ERROR:", error);

      return jsonResponse(
        {
          success: false,
          diagnostic: true,
          error: error.message || String(error)
        },
        500,
        corsHeaders
      );
    }
  }
};


// =====================================================
// NEWS API
// =====================================================

async function fetchLiveNews(stock, env) {

  // -----------------------------------------------
  // STEP 1 — Check binding exists
  // -----------------------------------------------

  if (!env.NEWS_API_KEY) {
    throw new Error(
      "DIAGNOSTIC 1: NEWS_API_KEY binding is NOT available at runtime."
    );
  }


  // -----------------------------------------------
  // STEP 2 — Check .get() exists
  // -----------------------------------------------

  if (
    typeof env.NEWS_API_KEY.get !== "function"
  ) {
    throw new Error(
      "DIAGNOSTIC 2: NEWS_API_KEY binding exists, but .get() is NOT available."
    );
  }


  // -----------------------------------------------
  // STEP 3 — Read secret
  // -----------------------------------------------

  let NEWS_API_KEY;

  try {
    NEWS_API_KEY =
      await env.NEWS_API_KEY.get();
  } catch (error) {

    throw new Error(
      "DIAGNOSTIC 3: NEWS_API_KEY binding exists, but reading the secret failed: " +
      (error.message || String(error))
    );
  }


  // -----------------------------------------------
  // STEP 4 — Check returned value
  // -----------------------------------------------

  if (!NEWS_API_KEY) {
    throw new Error(
      "DIAGNOSTIC 4: NEWS_API_KEY secret was read, but returned an EMPTY value."
    );
  }


  // -----------------------------------------------
  // STEP 5 — Call NewsAPI
  // -----------------------------------------------

  const query =
    encodeURIComponent(stock);

  const newsUrl =
    "https://newsapi.org/v2/everything" +
    "?q=" +
    query +
    "&language=en" +
    "&sortBy=publishedAt" +
    "&pageSize=5";


  let response;

  try {
    response = await fetch(
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
      "DIAGNOSTIC 5: Could not connect to NewsAPI: " +
      (error.message || String(error))
    );
  }


  // -----------------------------------------------
  // STEP 6 — Read NewsAPI response
  // -----------------------------------------------

  const responseText =
    await response.text();


  let data;

  try {
    data =
      JSON.parse(responseText);
  } catch {
    throw new Error(
      "DIAGNOSTIC 6: NewsAPI returned non-JSON response. HTTP " +
      response.status +
      ". Response: " +
      responseText.substring(0, 500)
    );
  }


  // -----------------------------------------------
  // STEP 7 — Check NewsAPI status
  // -----------------------------------------------

  if (!response.ok) {

    throw new Error(
      "DIAGNOSTIC 7: NewsAPI rejected the request. HTTP " +
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


  // -----------------------------------------------
  // STEP 8 — Check API response
  // -----------------------------------------------

  if (
    !data ||
    !Array.isArray(data.articles)
  ) {
    throw new Error(
      "DIAGNOSTIC 8: NewsAPI response does not contain an articles array."
    );
  }


  // -----------------------------------------------
  // STEP 9 — Return clean news
  // -----------------------------------------------

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


// =====================================================
// JSON RESPONSE HELPER
// =====================================================

function jsonResponse(
  data,
  status = 200,
  extraHeaders = {}
) {
  return new Response(
    JSON.stringify(data, null, 2),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...extraHeaders
      }
    }
  );
}
