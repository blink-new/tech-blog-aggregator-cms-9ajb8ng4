import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, Clock, User, ArrowLeft, Share2, Bookmark, Heart, ExternalLink } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import { Separator } from '../components/ui/separator'
import { articleService, type Article } from '../services/articleService'

export default function ArticlePage() {
  const { id } = useParams()
  const [article, setArticle] = useState<Article | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadArticle(id)
    }
  }, [id])

  const loadArticle = async (articleId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const articleData = await articleService.getArticleById(articleId)
      
      if (!articleData) {
        setError('Article not found')
        return
      }
      
      setArticle(articleData)
      
      // Load related articles
      const related = await articleService.getRelatedArticles(
        articleId, 
        articleData.category, 
        3
      )
      setRelatedArticles(related)
      
    } catch (error) {
      console.error('Error loading article:', error)
      setError('Failed to load article')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (!article) return
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: window.location.href,
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        // You could show a toast notification here
        console.log('Link copied to clipboard')
      } catch (err) {
        console.log('Failed to copy link')
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const estimateReadTime = (content: string) => {
    const wordsPerMinute = 200
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length
    const minutes = Math.ceil(wordCount / wordsPerMinute)
    return `${minutes} min read`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            {error || 'Article not found'}
          </h1>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Articles
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Back Button */}
      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Articles
          </Link>
        </Button>
      </div>

      {/* Article Header */}
      <header className="container mx-auto px-4 mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Badge 
              style={{ backgroundColor: article.categoryColor }}
              className="text-white"
            >
              {article.categoryName}
            </Badge>
            {article.isAggregated && article.sourceName && (
              <Badge variant="outline">
                Source: {article.sourceName}
              </Badge>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            {article.title}
          </h1>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <span className="font-medium">{article.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>{formatDate(article.publishedAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>{article.readTime || estimateReadTime(article.content)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLiked(!liked)}
                className={liked ? 'text-red-500 border-red-500' : ''}
              >
                <Heart className={`h-4 w-4 mr-2 ${liked ? 'fill-current' : ''}`} />
                Like
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBookmarked(!bookmarked)}
                className={bookmarked ? 'text-blue-500 border-blue-500' : ''}
              >
                <Bookmark className={`h-4 w-4 mr-2 ${bookmarked ? 'fill-current' : ''}`} />
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Featured Image */}
          {article.featuredImage && (
            <div className="mb-8">
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-64 md:h-96 object-cover rounded-lg"
                onError={(e) => {
                  // Fallback image if the original fails to load
                  const target = e.target as HTMLImageElement
                  target.src = `https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&h=600&fit=crop`
                }}
              />
            </div>
          )}
        </div>
      </header>

      {/* Article Content */}
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <article className="lg:col-span-3">
              <div 
                className="prose prose-lg max-w-none 
                  prose-headings:font-bold prose-headings:text-foreground
                  prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl 
                  prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
                  prose-blockquote:border-l-4 prose-blockquote:border-primary 
                  prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground
                  prose-ul:text-muted-foreground prose-ol:text-muted-foreground
                  prose-li:mb-2 prose-strong:text-foreground
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t">
                  <h3 className="font-semibold mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Source Link */}
              {article.isAggregated && article.sourceUrl && (
                <div className="mt-8 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    This article was originally published on {article.sourceName}
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Read Original Article
                    </a>
                  </Button>
                </div>
              )}
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Author Info */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">About the Author</h3>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                        {article.author.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{article.author}</p>
                        <p className="text-sm text-muted-foreground">
                          {article.isAggregated ? 'Contributing Writer' : 'Tech Writer'}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {article.isAggregated 
                        ? `Originally published on ${article.sourceName}. Passionate about technology and its impact on society.`
                        : 'Passionate about technology and its impact on society. Specializes in AI, web development, and emerging tech trends.'
                      }
                    </p>
                  </CardContent>
                </Card>

                {/* Related Articles */}
                {relatedArticles.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4">Related Articles</h3>
                      <div className="space-y-4">
                        {relatedArticles.map((related, index) => (
                          <div key={related.id}>
                            <Link 
                              to={`/article/${related.id}`}
                              className="block group"
                            >
                              {related.featuredImage && (
                                <img
                                  src={related.featuredImage}
                                  alt={related.title}
                                  className="w-full h-24 object-cover rounded mb-2 group-hover:opacity-80 transition-opacity"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = `https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=200&fit=crop`
                                  }}
                                />
                              )}
                              <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                {related.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <span>{related.author}</span>
                                <span>•</span>
                                <span>{related.readTime || estimateReadTime(related.content)}</span>
                              </div>
                            </Link>
                            {index < relatedArticles.length - 1 && (
                              <Separator className="mt-4" />
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Newsletter Signup */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Stay Updated</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Get the latest tech insights and tutorials delivered to your inbox.
                    </p>
                    <Button className="w-full">
                      Subscribe to Newsletter
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}