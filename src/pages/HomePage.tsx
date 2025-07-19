import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Calendar, Clock, User, ArrowRight, TrendingUp, Search, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { articleService, type Article, type Category } from '../services/articleService'

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [articles, setArticles] = useState<Article[]>([])
  const [featuredArticle, setFeaturedArticle] = useState<Article | null>(null)
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all')
  const [filterType, setFilterType] = useState(searchParams.get('type') || 'all')

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Handle URL params and filtering
  useEffect(() => {
    const category = searchParams.get('category') || 'all'
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || 'all'
    
    setSelectedCategory(category)
    setSearchQuery(search)
    setFilterType(type)
    
    loadArticles({ category, search, type })
  }, [searchParams])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [categoriesData, featuredData, trendingData] = await Promise.all([
        articleService.getCategories(),
        articleService.getFeaturedArticle(),
        articleService.getTrendingArticles(3)
      ])
      
      setCategories(categoriesData)
      setFeaturedArticle(featuredData)
      setTrendingArticles(trendingData)
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadArticles = async ({ category = 'all', search = '', type = 'all' }) => {
    try {
      const filters: any = {}
      
      if (category !== 'all') {
        filters.category = category
      }
      
      if (search.trim()) {
        filters.search = search.trim()
      }
      
      if (type === 'aggregated') {
        filters.isAggregated = true
      } else if (type === 'original') {
        filters.isAggregated = false
      }
      
      const articlesData = await articleService.getArticles(filters)
      setArticles(articlesData)
    } catch (error) {
      console.error('Error loading articles:', error)
      setArticles([])
    }
  }

  const handleSearch = (query: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (query.trim()) {
      newParams.set('search', query.trim())
    } else {
      newParams.delete('search')
    }
    setSearchParams(newParams)
  }

  const handleCategoryChange = (category: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (category !== 'all') {
      newParams.set('category', category)
    } else {
      newParams.delete('category')
    }
    setSearchParams(newParams)
  }

  const handleTypeFilter = (type: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (type !== 'all') {
      newParams.set('type', type)
    } else {
      newParams.delete('type')
    }
    setSearchParams(newParams)
  }

  const allCategories = [
    { id: 'all', name: 'All Posts', color: '#2563eb', description: 'All articles' },
    ...categories
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Stay Ahead in <span className="text-primary">Tech</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover the latest insights, tutorials, and trends in technology, AI, and software development from industry experts and thought leaders.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="Search articles, authors, topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                  className="pl-10 pr-4 py-3 text-lg"
                />
                <Button 
                  onClick={() => handleSearch(searchQuery)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  size="sm"
                >
                  Search
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8">
                Explore Articles
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Subscribe to Newsletter
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Article */}
      {featuredArticle && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-8">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Featured Article</h2>
            </div>
            
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <img
                    src={featuredArticle.featuredImage}
                    alt={featuredArticle.title}
                    className="w-full h-64 md:h-full object-cover"
                  />
                </div>
                <div className="md:w-1/2 p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge 
                      style={{ backgroundColor: featuredArticle.categoryColor }}
                      className="text-white"
                    >
                      {featuredArticle.categoryName}
                    </Badge>
                    {featuredArticle.isAggregated && (
                      <Badge variant="outline">
                        {featuredArticle.sourceName}
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-4 line-clamp-2">
                    <Link 
                      to={`/article/${featuredArticle.id}`}
                      className="hover:text-primary transition-colors"
                    >
                      {featuredArticle.title}
                    </Link>
                  </h3>
                  
                  <p className="text-muted-foreground mb-6 line-clamp-3">
                    {featuredArticle.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {featuredArticle.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(featuredArticle.publishedAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {featuredArticle.readTime}
                      </div>
                    </div>
                    
                    <Button asChild>
                      <Link to={`/article/${featuredArticle.id}`}>
                        Read More
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className="w-full">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar */}
              <aside className="lg:w-80">
                <div className="sticky top-24 space-y-6">
                  {/* Filters */}
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Filters
                    </h3>
                    <div className="space-y-3">
                      <Select value={filterType} onValueChange={handleTypeFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Articles</SelectItem>
                          <SelectItem value="original">Original Content</SelectItem>
                          <SelectItem value="aggregated">Aggregated Content</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <h3 className="font-semibold mb-4">Categories</h3>
                    <TabsList className="grid grid-cols-1 w-full h-auto p-1">
                      {allCategories.map((cat) => (
                        <TabsTrigger
                          key={cat.id}
                          value={cat.id}
                          className="justify-start data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {/* Trending Posts */}
                  {trendingArticles.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-4">Trending</h3>
                      <div className="space-y-4">
                        {trendingArticles.map((post, index) => (
                          <Card key={post.id} className="p-4">
                            <div className="flex gap-3">
                              <div className="text-2xl font-bold text-primary/30">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-sm line-clamp-2 mb-2">
                                  <Link 
                                    to={`/article/${post.id}`}
                                    className="hover:text-primary transition-colors"
                                  >
                                    {post.title}
                                  </Link>
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{post.readTime}</span>
                                  <span>•</span>
                                  <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </aside>

              {/* Main Content */}
              <div className="flex-1">
                {allCategories.map((cat) => (
                  <TabsContent key={cat.id} value={cat.id} className="mt-0">
                    <div className="mb-6">
                      <h2 className="text-3xl font-bold mb-2">
                        {cat.id === 'all' ? 'Latest Articles' : `${cat.name} Articles`}
                      </h2>
                      <p className="text-muted-foreground">
                        {cat.id === 'all' 
                          ? 'Discover the latest insights and tutorials from the tech world'
                          : cat.description || `Latest articles and insights about ${cat.name.toLowerCase()}`
                        }
                      </p>
                      
                      {/* Results count */}
                      <div className="mt-4 text-sm text-muted-foreground">
                        {searchQuery && (
                          <span>Search results for "{searchQuery}" • </span>
                        )}
                        {articles.length} article{articles.length !== 1 ? 's' : ''} found
                      </div>
                    </div>

                    <div className="grid gap-6">
                      {articles.length === 0 ? (
                        <Card className="p-8 text-center">
                          <p className="text-muted-foreground">
                            {searchQuery 
                              ? `No articles found for "${searchQuery}"`
                              : 'No articles found in this category'
                            }
                          </p>
                          {searchQuery && (
                            <Button 
                              variant="outline" 
                              onClick={() => handleSearch('')}
                              className="mt-4"
                            >
                              Clear Search
                            </Button>
                          )}
                        </Card>
                      ) : (
                        articles.map((post) => (
                          <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="md:flex">
                              <div className="md:w-80">
                                <img
                                  src={post.featuredImage}
                                  alt={post.title}
                                  className="w-full h-48 md:h-full object-cover"
                                />
                              </div>
                              <CardContent className="flex-1 p-6">
                                <div className="flex items-center gap-2 mb-3">
                                  <Badge 
                                    style={{ backgroundColor: post.categoryColor }}
                                    className="text-white"
                                  >
                                    {post.categoryName}
                                  </Badge>
                                  {post.isAggregated && (
                                    <Badge variant="outline">
                                      {post.sourceName}
                                    </Badge>
                                  )}
                                </div>
                                
                                <h3 className="text-xl font-bold mb-3 line-clamp-2">
                                  <Link 
                                    to={`/article/${post.id}`}
                                    className="hover:text-primary transition-colors"
                                  >
                                    {post.title}
                                  </Link>
                                </h3>
                                
                                <p className="text-muted-foreground mb-4 line-clamp-2">
                                  {post.excerpt}
                                </p>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <User className="h-4 w-4" />
                                      {post.author}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      {new Date(post.publishedAt).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {post.readTime}
                                    </div>
                                  </div>
                                  
                                  <Button variant="ghost" asChild>
                                    <Link to={`/article/${post.id}`}>
                                      Read More
                                      <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                  </Button>
                                </div>
                              </CardContent>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>
                ))}
              </div>
            </div>
          </Tabs>
        </div>
      </section>
    </div>
  )
}