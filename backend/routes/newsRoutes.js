import express from "express";

const router = express.Router();

const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

const getCached = (key) => {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.value;
};

const setCached = (key, value) => {
  cache.set(key, { ts: Date.now(), value });
};

router.get("/", async (req, res) => {
  const category = String(req.query.category || "All");
  const fallbackNews = [
    {
      id: 1,
      title: "AI in education continues to grow",
      summary: "Educational institutions are increasing adoption of AI-powered tutoring and workflow tools.",
      category: category === "All" ? "Technology" : category,
      image: "",
      url: "https://news.google.com/",
    },
  ];

  try {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      return res.json(fallbackNews);
    }

    const cacheKey = `news:${category}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const params = new URLSearchParams({
      apiKey,
      pageSize: "30",
      language: "en",
      q: category !== "All" ? category : "technology OR education OR AI OR science",
    });
    const url = `https://newsapi.org/v2/everything?${params.toString()}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      return res.json(fallbackNews);
    }

    const news = Array.isArray(data.articles)
      ? data.articles
          .filter((article) => article?.title)
          .map((article, index) => ({
            id: index + 1,
            title: String(article.title || ""),
            summary: String(article.description || article.content || "").slice(0, 240),
            category: category === "All" ? "Technology" : category,
            image: String(article.urlToImage || ""),
            url: String(article.url || ""),
          }))
      : [];

    const output = news.length ? news : fallbackNews;
    setCached(cacheKey, output);
    return res.json(output);
  } catch (_error) {
    return res.json(fallbackNews);
  }
});

export default router;
