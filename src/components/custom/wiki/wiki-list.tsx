"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { WysiwygEditor } from '@/components/shared/wysiwyg-editor'
import { 
  getAllWikiPagesAction, 
  createWikiPageAction,
  deleteWikiPageAction,
} from '@/actions/wiki'
import type { WikiPage } from '@/data/wiki'
import { 
  Plus, 
  Search, 
  FileText, 
  Edit, 
  Trash2,
  Eye,
  Calendar
} from 'lucide-react'

// Helper function to strip HTML tags
const stripHtml = (html: string) => {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

export function WikiList() {
  const router = useRouter()
  const [pages, setPages] = useState<WikiPage[]>([])
  const [filteredPages, setFilteredPages] = useState<WikiPage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newPageTitle, setNewPageTitle] = useState('')
  const [newPageContent, setNewPageContent] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    loadPages()
  }, [])

  useEffect(() => {
    // Filter pages based on search term
    if (searchTerm) {
      const filtered = pages.filter(page => 
        page.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredPages(filtered)
    } else {
      setFilteredPages(pages)
    }
  }, [searchTerm, pages])

  const loadPages = async () => {
    setIsLoading(true)
    try {
      const result = await getAllWikiPagesAction(false) // Don't include hierarchy for list view
      if (result.success && result.pages) {
        setPages(result.pages)
        setFilteredPages(result.pages)
      } else {
        toast.error('Failed to load wiki pages')
      }
    } catch (error) {
      toast.error('Error loading wiki pages')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePage = async () => {
    if (!newPageTitle.trim()) {
      toast.error('Please enter a page title')
      return
    }

    setIsCreating(true)
    try {
      const result = await createWikiPageAction({
        title: newPageTitle,
        content: newPageContent,
        slug: newPageTitle.toLowerCase().replace(/\s+/g, '-')
      })

      if (result.success) {
        toast.success('Page created successfully!')
        setShowCreateDialog(false)
        setNewPageTitle('')
        setNewPageContent('')
        loadPages()
        
        // Navigate to the new page
        if (result.page) {
          router.push(`/wiki/${result.page.id}`)
        }
      } else {
        toast.error(result.error || 'Failed to create page')
      }
    } catch (error) {
      toast.error('Error creating page')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeletePage = async (pageId: string, pageTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${pageTitle}"?`)) return

    try {
      const result = await deleteWikiPageAction(pageId)
      if (result.success) {
        toast.success('Page deleted successfully!')
        loadPages()
      } else {
        toast.error(result.error || 'Failed to delete page')
      }
    } catch (error) {
      toast.error('Error deleting page')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading wiki pages...</div>
      </div>
    )
  }

  return (
    <div className="w-full p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Wiki</h1>
          <p className="text-gray-600">Documentation and knowledge base</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Page
            </Button>
          </DialogTrigger>
          <DialogContent className="!w-[calc(100vw-16rem)] !max-w-none !sm:max-w-none max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Wiki Page</DialogTitle>
              <DialogDescription>
                Create a new documentation page
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Page Title</label>
                <Input
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="Enter page title..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Content</label>
                <div className="mt-1">
                  <WysiwygEditor
                    content={newPageContent}
                    onChange={setNewPageContent}
                    placeholder="Write your page content here..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreatePage}
                  disabled={isCreating || !newPageTitle.trim()}
                  className="flex items-center gap-2"
                >
                  {isCreating ? 'Creating...' : 'Create Page'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search wiki pages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Pages Grid */}
      {filteredPages.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No pages found' : 'No wiki pages yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Create your first wiki page to get started'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create First Page
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPages.map((page) => (
            <Card key={page.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    {page.title}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/wiki/${page.id}`)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/wiki/${page.id}?edit=true`)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePage(page.id, page.title)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Updated: {formatDate(page.updated_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      page.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {page.status}
                    </span>
                  </div>
                </div>
                
                {/* Content preview */}
                <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                  <div 
                    className="line-clamp-3"
                    dangerouslySetInnerHTML={{ 
                      __html: stripHtml(page.content || 'No content').slice(0, 150) + '...' 
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
