import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, BookOpen, Calendar, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";

const Blog = () => {
  const { t } = useTranslation();

  const featuredPost = {
    titleKey: 'pages.blog.featuredTitle',
    excerptKey: 'pages.blog.featuredExcerpt',
    image: "",
    author: "Nabil Laaziri",
    date: "December 15, 2024",
    categoryKey: 'pages.blog.categoryImpact',
  };

  const posts = [
    {
      titleKey: 'pages.blog.post1Title',
      excerptKey: 'pages.blog.post1Excerpt',
      author: "Nabil Laaziri",
      date: "December 10, 2024",
      categoryKey: 'pages.blog.categoryGuides',
    },
    {
      titleKey: 'pages.blog.post2Title',
      excerptKey: 'pages.blog.post2Excerpt',
      author: "Nabil Laaziri",
      date: "December 5, 2024",
      categoryKey: 'pages.blog.categoryNews',
    },
    {
      titleKey: 'pages.blog.post3Title',
      excerptKey: 'pages.blog.post3Excerpt',
      author: "Nabil Laaziri",
      date: "November 28, 2024",
      categoryKey: 'pages.blog.categoryResearch',
    },
    {
      titleKey: 'pages.blog.post4Title',
      excerptKey: 'pages.blog.post4Excerpt',
      author: "Nabil Laaziri",
      date: "November 20, 2024",
      categoryKey: 'pages.blog.categoryCommunity',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              CleanAfricaNow
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t('pages.blog.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('pages.blog.subtitle')}
          </p>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-card rounded-2xl overflow-hidden border border-border/40 hover:shadow-xl transition-shadow">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <img
                    src={featuredPost.image}
                    alt={t(featuredPost.titleKey)}
                    className="w-full h-64 md:h-full object-cover"
                  />
                </div>
                <div className="md:w-1/2 p-8">
                  <Badge className="mb-4">{t(featuredPost.categoryKey)}</Badge>
                  <h2 className="text-2xl font-bold mb-4">{t(featuredPost.titleKey)}</h2>
                  <p className="text-muted-foreground mb-6">{t(featuredPost.excerptKey)}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {featuredPost.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {featuredPost.date}
                    </span>
                  </div>
                  <Button className="gap-2">
                    {t('pages.blog.readMore')} <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('pages.blog.latestPosts')}</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {posts.map((post, index) => (
              <div
                key={index}
                className="bg-background rounded-xl p-6 border border-border/40 hover:shadow-lg transition-all hover:border-primary/40"
              >
                <Badge variant="secondary" className="mb-4">{t(post.categoryKey)}</Badge>
                <h3 className="text-xl font-semibold mb-3">{t(post.titleKey)}</h3>
                <p className="text-muted-foreground mb-4">{t(post.excerptKey)}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {post.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {post.date}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1">
                    {t('pages.blog.readMore')} <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('pages.blog.stayUpdated')}</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('pages.blog.stayUpdatedDesc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              className="flex-1 px-4 py-2 rounded-lg border border-border bg-background"
            />
            <Button>{t('pages.blog.subscribe')}</Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
