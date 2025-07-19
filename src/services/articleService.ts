import { blink } from '../blink/client'

export interface Article {
  id: string
  title: string
  content: string
  excerpt: string
  author: string
  category: string
  categoryName: string
  categoryColor: string
  featuredImage: string
  publishedAt: string
  readTime: string
  isAggregated: boolean
  sourceName?: string
  sourceUrl?: string
  tags: string[]
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  color: string
  description: string
  userId: string
  createdAt: string
}

export interface ArticleFilters {
  category?: string
  search?: string
  isAggregated?: boolean
  limit?: number
  offset?: number
}

class ArticleService {
  async getArticles(filters: ArticleFilters = {}): Promise<Article[]> {
    try {
      const { category, search, isAggregated, limit = 20, offset = 0 } = filters
      
      const whereConditions: any[] = []
      
      // Category filter
      if (category && category !== 'all') {
        whereConditions.push({ category })
      }
      
      // Search filter (title, excerpt, author, tags)
      if (search) {
        whereConditions.push({
          OR: [
            { title: { contains: search } },
            { excerpt: { contains: search } },
            { author: { contains: search } },
            { tags: { contains: search } }
          ]
        })
      }
      
      // Aggregated filter
      if (typeof isAggregated === 'boolean') {
        whereConditions.push({ isAggregated: isAggregated ? "1" : "0" })
      }
      
      const whereClause = whereConditions.length > 0 
        ? { AND: whereConditions }
        : {}
      
      const articles = await blink.db.articles.list({
        where: whereClause,
        orderBy: { publishedAt: 'desc' },
        limit,
        // offset // Note: offset might not be supported, using limit for now
      })
      
      return articles.map(this.transformArticle)
    } catch (error) {
      console.error('Error fetching articles:', error)
      return []
    }
  }
  
  async getArticleById(id: string): Promise<Article | null> {
    try {
      const articles = await blink.db.articles.list({
        where: { id },
        limit: 1
      })
      
      if (articles.length === 0) {
        return null
      }
      
      return this.transformArticle(articles[0])
    } catch (error) {
      console.error('Error fetching article:', error)
      return null
    }
  }
  
  async getFeaturedArticle(): Promise<Article | null> {
    try {
      const articles = await blink.db.articles.list({
        orderBy: { publishedAt: 'desc' },
        limit: 1
      })
      
      if (articles.length === 0) {
        return null
      }
      
      return this.transformArticle(articles[0])
    } catch (error) {
      console.error('Error fetching featured article:', error)
      return null
    }
  }
  
  async getTrendingArticles(limit: number = 3): Promise<Article[]> {
    try {
      const articles = await blink.db.articles.list({
        orderBy: { publishedAt: 'desc' },
        limit: limit + 1 // Get one extra to skip the featured article
      })
      
      // Skip the first article (featured) and return the rest
      return articles.slice(1).map(this.transformArticle)
    } catch (error) {
      console.error('Error fetching trending articles:', error)
      return []
    }
  }
  
  async getRelatedArticles(articleId: string, category: string, limit: number = 3): Promise<Article[]> {
    try {
      const articles = await blink.db.articles.list({
        where: { 
          AND: [
            { category },
            { id: { not: articleId } }
          ]
        },
        orderBy: { publishedAt: 'desc' },
        limit
      })
      
      return articles.map(this.transformArticle)
    } catch (error) {
      console.error('Error fetching related articles:', error)
      return []
    }
  }
  
  async getCategories(): Promise<Category[]> {
    try {
      const categories = await blink.db.categories.list({
        orderBy: { name: 'asc' }
      })
      
      return categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        description: cat.description || '',
        userId: cat.userId || cat.user_id,
        createdAt: cat.createdAt || cat.created_at
      }))
    } catch (error) {
      console.error('Error fetching categories:', error)
      return []
    }
  }
  
  async createArticle(articleData: Partial<Article>): Promise<Article | null> {
    try {
      const id = `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const article = await blink.db.articles.create({
        id,
        title: articleData.title || '',
        content: articleData.content || '',
        excerpt: articleData.excerpt || '',
        author: articleData.author || '',
        category: articleData.category || '',
        categoryName: articleData.categoryName || '',
        categoryColor: articleData.categoryColor || '#2563eb',
        featuredImage: articleData.featuredImage || '',
        publishedAt: articleData.publishedAt || new Date().toISOString().split('T')[0],
        readTime: articleData.readTime || '5 min read',
        isAggregated: articleData.isAggregated ? "1" : "0",
        sourceName: articleData.sourceName || null,
        sourceUrl: articleData.sourceUrl || null,
        tags: JSON.stringify(articleData.tags || []),
        userId: articleData.userId || 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      
      return this.transformArticle(article)
    } catch (error) {
      console.error('Error creating article:', error)
      return null
    }
  }
  
  async updateArticle(id: string, articleData: Partial<Article>): Promise<Article | null> {
    try {
      const updateData: any = {
        updatedAt: new Date().toISOString()
      }
      
      if (articleData.title) updateData.title = articleData.title
      if (articleData.content) updateData.content = articleData.content
      if (articleData.excerpt) updateData.excerpt = articleData.excerpt
      if (articleData.author) updateData.author = articleData.author
      if (articleData.category) updateData.category = articleData.category
      if (articleData.categoryName) updateData.categoryName = articleData.categoryName
      if (articleData.categoryColor) updateData.categoryColor = articleData.categoryColor
      if (articleData.featuredImage) updateData.featuredImage = articleData.featuredImage
      if (articleData.publishedAt) updateData.publishedAt = articleData.publishedAt
      if (articleData.readTime) updateData.readTime = articleData.readTime
      if (typeof articleData.isAggregated === 'boolean') updateData.isAggregated = articleData.isAggregated ? "1" : "0"
      if (articleData.sourceName) updateData.sourceName = articleData.sourceName
      if (articleData.sourceUrl) updateData.sourceUrl = articleData.sourceUrl
      if (articleData.tags) updateData.tags = JSON.stringify(articleData.tags)
      
      await blink.db.articles.update(id, updateData)
      
      return this.getArticleById(id)
    } catch (error) {
      console.error('Error updating article:', error)
      return null
    }
  }
  
  async deleteArticle(id: string): Promise<boolean> {
    try {
      await blink.db.articles.delete(id)
      return true
    } catch (error) {
      console.error('Error deleting article:', error)
      return false
    }
  }
  
  private transformArticle(dbArticle: any): Article {
    return {
      id: dbArticle.id,
      title: dbArticle.title,
      content: dbArticle.content,
      excerpt: dbArticle.excerpt,
      author: dbArticle.author,
      category: dbArticle.category,
      categoryName: dbArticle.categoryName || dbArticle.category_name,
      categoryColor: dbArticle.categoryColor || dbArticle.category_color,
      featuredImage: dbArticle.featuredImage || dbArticle.featured_image,
      publishedAt: dbArticle.publishedAt || dbArticle.published_at,
      readTime: dbArticle.readTime || dbArticle.read_time,
      isAggregated: Number(dbArticle.isAggregated || dbArticle.is_aggregated) > 0,
      sourceName: dbArticle.sourceName || dbArticle.source_name,
      sourceUrl: dbArticle.sourceUrl || dbArticle.source_url,
      tags: this.parseTags(dbArticle.tags),
      userId: dbArticle.userId || dbArticle.user_id,
      createdAt: dbArticle.createdAt || dbArticle.created_at,
      updatedAt: dbArticle.updatedAt || dbArticle.updated_at
    }
  }
  
  private parseTags(tagsString: string): string[] {
    try {
      return JSON.parse(tagsString || '[]')
    } catch {
      return []
    }
  }
}

export const articleService = new ArticleService()