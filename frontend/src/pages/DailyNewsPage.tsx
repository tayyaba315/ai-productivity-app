import { useEffect, useMemo, useState } from 'react';
import { Newspaper, ExternalLink } from 'lucide-react';
import ImageWithFallback from '../components/figma/ImageWithFallback';
import { apiUrl } from '../lib/api';

interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  category: string;
  image: string;
  url: string;
}

export default function DailyNewsPage() {
  const categories = ['All', 'Technology', 'Business', 'Education', 'AI', 'Science'];
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(apiUrl(`/news?category=${encodeURIComponent(selectedCategory)}`));
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || 'Failed to fetch news');
        setArticles(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch news');
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    void loadNews();
  }, [selectedCategory]);

  const filteredArticles = useMemo(() => articles, [articles]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <Newspaper className="w-10 h-10" />
          <h1 className="text-4xl font-bold">Daily News</h1>
        </div>
        <p className="text-lg text-white/90">Stay updated with the latest news and trends</p>
      </div>

      {/* Category Filters */}
      <div className="bg-card backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border">
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`
                px-5 py-2 rounded-xl transition-all font-medium
                ${selectedCategory === category
                  ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg'
                  : 'bg-background text-muted-foreground hover:bg-card'
                }
              `}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* News Articles Grid */}
      {loading && <p className="text-muted-foreground">Loading news...</p>}
      {error && <p className="text-destructive">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article) => (
          <div
            key={article.id}
            className="bg-card backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-primary/10 transition-all overflow-hidden border border-border group cursor-pointer"
          >
            {/* Article Image */}
            <div className="relative h-48 overflow-hidden">
              <ImageWithFallback
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute top-3 right-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/90 backdrop-blur-sm text-white">
                  {article.category}
                </span>
              </div>
            </div>

            {/* Article Content */}
            <div className="p-5 space-y-3">
              <h3 className="text-lg font-bold text-foreground group-hover:text-primary/80 transition-colors line-clamp-2">
                {article.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {article.summary}
              </p>
              <button
                onClick={() => {
                  if (article.url) window.open(article.url, '_blank', 'noopener,noreferrer');
                }}
                className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm group/btn"
              >
                <span>Read More</span>
                <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="bg-card backdrop-blur-sm rounded-2xl p-12 text-center shadow-lg border border-border">
          <Newspaper className="w-16 h-16 text-border mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">No articles found in this category</p>
        </div>
      )}
    </div>
  );
}