import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Eye, Upload, X } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Switch } from '../components/ui/switch'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { articleService, type Article, type Category } from '../services/articleService'
import { blink } from '../blink/client'

export default function CreatePost() {
  const navigate = useNavigate()
  const { id } = useParams() // For editing existing posts
  const isEditing = Boolean(id)
  
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    author: '',
    category: '',
    featuredImage: '',
    isAggregated: false,
    sourceName: '',
    sourceUrl: '',
    tags: [] as string[],
    readTime: ''
  })
  
  const [newTag, setNewTag] = useState('')
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    loadCategories()
    if (isEditing && id) {
      loadArticle(id)
    }
  }, [isEditing, id])

  const loadCategories = async () => {
    try {
      const categoriesData = await articleService.getCategories()
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadArticle = async (articleId: string) => {
    setLoading(true)
    try {
      const article = await articleService.getArticleById(articleId)
      if (article) {
        setFormData({
          title: article.title,
          excerpt: article.excerpt,
          content: article.content,
          author: article.author,
          category: article.category,
          featuredImage: article.featuredImage,
          isAggregated: article.isAggregated,
          sourceName: article.sourceName || '',
          sourceUrl: article.sourceUrl || '',
          tags: article.tags,
          readTime: article.readTime
        })
      }
    } catch (error) {
      console.error('Error loading article:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const { publicUrl } = await blink.storage.upload(
        file,
        `blog-images/${Date.now()}-${file.name}`,
        { upsert: true }
      )
      handleInputChange('featuredImage', publicUrl)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleInputChange('tags', [...formData.tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove))
  }

  const estimateReadTime = (content: string) => {
    const wordsPerMinute = 200
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length
    const minutes = Math.ceil(wordCount / wordsPerMinute)
    return `${minutes} min read`
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      alert('Please enter a title')
      return false
    }
    if (!formData.excerpt.trim()) {
      alert('Please enter an excerpt')
      return false
    }
    if (!formData.content.trim()) {
      alert('Please enter content')
      return false
    }
    if (!formData.author.trim()) {
      alert('Please enter an author name')
      return false
    }
    if (!formData.category) {
      alert('Please select a category')
      return false
    }
    return true
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      const selectedCategory = categories.find(cat => cat.id === formData.category)
      
      const articleData: Partial<Article> = {
        title: formData.title.trim(),
        excerpt: formData.excerpt.trim(),
        content: formData.content.trim(),
        author: formData.author.trim(),
        category: formData.category,
        categoryName: selectedCategory?.name || formData.category,
        categoryColor: selectedCategory?.color || '#2563eb',
        featuredImage: formData.featuredImage,
        isAggregated: formData.isAggregated,
        sourceName: formData.isAggregated ? formData.sourceName : undefined,
        sourceUrl: formData.isAggregated ? formData.sourceUrl : undefined,
        tags: formData.tags,
        readTime: formData.readTime || estimateReadTime(formData.content),
        publishedAt: new Date().toISOString().split('T')[0],
        userId: 'admin' // In a real app, this would come from auth
      }

      let result
      if (isEditing && id) {
        result = await articleService.updateArticle(id, articleData)
      } else {
        result = await articleService.createArticle(articleData)
      }

      if (result) {
        navigate('/admin')
      } else {
        alert('Failed to save article. Please try again.')
      }
    } catch (error) {
      console.error('Error saving article:', error)
      alert('Failed to save article. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const selectedCategory = categories.find(cat => cat.id === formData.category)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {isEditing ? 'Edit Article' : 'Create New Article'}
              </h1>
              <p className="text-muted-foreground">
                {isEditing ? 'Update your article content' : 'Write and publish a new blog post'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="mr-2 h-4 w-4" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : (isEditing ? 'Update' : 'Publish')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={previewMode ? 'preview' : 'edit'} className="w-full">
              <TabsContent value="edit">
                <Card>
                  <CardHeader>
                    <CardTitle>Article Content</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Title */}
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Enter article title..."
                        className="mt-1"
                      />
                    </div>

                    {/* Excerpt */}
                    <div>
                      <Label htmlFor="excerpt">Excerpt *</Label>
                      <Textarea
                        id="excerpt"
                        value={formData.excerpt}
                        onChange={(e) => handleInputChange('excerpt', e.target.value)}
                        placeholder="Brief description of the article..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>

                    {/* Featured Image */}
                    <div>
                      <Label htmlFor="image">Featured Image</Label>
                      <div className="mt-1 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={formData.featuredImage}
                            onChange={(e) => handleInputChange('featuredImage', e.target.value)}
                            placeholder="Image URL or upload below..."
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('image-upload')?.click()}
                            disabled={uploadingImage}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            {uploadingImage ? 'Uploading...' : 'Upload'}
                          </Button>
                        </div>
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        {formData.featuredImage && (
                          <img
                            src={formData.featuredImage}
                            alt="Featured"
                            className="w-full h-48 object-cover rounded border"
                          />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      <Label htmlFor="content">Content *</Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => handleInputChange('content', e.target.value)}
                        placeholder="Write your article content here... You can use HTML tags for formatting."
                        rows={20}
                        className="mt-1 font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Estimated read time: {estimateReadTime(formData.content)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preview">
                <Card>
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {formData.featuredImage && (
                      <img
                        src={formData.featuredImage}
                        alt={formData.title}
                        className="w-full h-64 object-cover rounded mb-6"
                      />
                    )}
                    
                    <h1 className="text-3xl font-bold mb-4">{formData.title || 'Article Title'}</h1>
                    
                    <p className="text-lg text-muted-foreground mb-6">
                      {formData.excerpt || 'Article excerpt will appear here...'}
                    </p>
                    
                    <div 
                      className="prose prose-lg max-w-none 
                        prose-headings:font-bold prose-headings:text-foreground
                        prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl 
                        prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
                        prose-blockquote:border-l-4 prose-blockquote:border-primary 
                        prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground
                        prose-ul:text-muted-foreground prose-ol:text-muted-foreground
                        prose-li:mb-2 prose-strong:text-foreground"
                      dangerouslySetInnerHTML={{ 
                        __html: formData.content || '<p>Article content will appear here...</p>' 
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Article Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Article Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Author */}
                <div>
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => handleInputChange('author', e.target.value)}
                    placeholder="Author name"
                    className="mt-1"
                  />
                </div>

                {/* Category */}
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Read Time */}
                <div>
                  <Label htmlFor="readTime">Read Time</Label>
                  <Input
                    id="readTime"
                    value={formData.readTime}
                    onChange={(e) => handleInputChange('readTime', e.target.value)}
                    placeholder="e.g., 5 min read"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to auto-calculate
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Aggregated Content Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Content Source</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="aggregated"
                    checked={formData.isAggregated}
                    onCheckedChange={(checked) => handleInputChange('isAggregated', checked)}
                  />
                  <Label htmlFor="aggregated">Aggregated Content</Label>
                </div>

                {formData.isAggregated && (
                  <>
                    <div>
                      <Label htmlFor="sourceName">Source Name</Label>
                      <Input
                        id="sourceName"
                        value={formData.sourceName}
                        onChange={(e) => handleInputChange('sourceName', e.target.value)}
                        placeholder="e.g., TechCrunch, Medium"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="sourceUrl">Source URL</Label>
                      <Input
                        id="sourceUrl"
                        value={formData.sourceUrl}
                        onChange={(e) => handleInputChange('sourceUrl', e.target.value)}
                        placeholder="https://..."
                        className="mt-1"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button onClick={addTag} variant="outline">
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Preview Info */}
            {selectedCategory && (
              <Card>
                <CardHeader>
                  <CardTitle>Preview Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Category:</span>
                      <Badge style={{ backgroundColor: selectedCategory.color }} className="text-white">
                        {selectedCategory.name}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <Badge variant={formData.isAggregated ? 'outline' : 'default'}>
                        {formData.isAggregated ? 'Aggregated' : 'Original'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Read Time:</span>
                      <span className="text-muted-foreground">
                        {formData.readTime || estimateReadTime(formData.content)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Word Count:</span>
                      <span className="text-muted-foreground">
                        {formData.content.replace(/<[^>]*>/g, '').split(/\s+/).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}