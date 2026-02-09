"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
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
  updateWikiPageAction,
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

interface ProjectWikiListProps {
  projectId: string | null | undefined
  currentUserId: string
  title?: string
  showHeader?: boolean
}

export function ProjectWikiList({ 
  projectId, 
  currentUserId,
  title = "Project Wiki",
  showHeader = true
}: ProjectWikiListProps) {
  const router = useRouter()
  const [pages, setPages] = useState<WikiPage[]>([])
  const [filteredPages, setFilteredPages] = useState<WikiPage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newPageTitle, setNewPageTitle] = useState('')
  const [newPageContent, setNewPageContent] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState('')

  useEffect(() => {
    loadPages()
  }, [projectId])

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
      const result = await getAllWikiPagesAction(false, projectId || undefined) // Pass projectId for filtering
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

    // Validate user ID before creating page
    if (!currentUserId) {
      toast.error('User not authenticated. Please log in again.')
      return
    }

    setIsCreating(true)
    try {
      const result = await createWikiPageAction({
        title: newPageTitle,
        content: newPageContent,
        slug: newPageTitle.toLowerCase().replace(/\s+/g, '-'),
        project_id: projectId || undefined, // Important: Associate with project or general wiki
        created_by: currentUserId
      })

      if (result.success) {
        toast.success('Page created successfully!')
        setShowCreateDialog(false)
        setNewPageTitle('')
        setNewPageContent('')
        loadPages()
        
        // Navigate to the full page view
        if (result.page) {
          router.push(`/projects/${projectId}/wiki?id=${result.page.id}`)
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

  const handleSaveEdit = async () => {
    if (!editingPageId) return

    try {
      const result = await updateWikiPageAction(editingPageId, {
        content: editedContent,
        title: pages.find(p => p.id === editingPageId)?.title || '',
        status: 'published'
      })

      if (result.success) {
        toast.success('Page updated successfully!')
        setIsEditing(false)
        setEditingPageId(null)
        loadPages()
      } else {
        toast.error(result.error || 'Failed to update page')
      }
    } catch (error) {
      toast.error('Error updating page')
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingPageId(null)
    setEditedContent('')
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
    <div className="w-full">
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A] mb-2">{title}</h2>
            <p className="text-[#0F172A]/60">Project documentation and knowledge base</p>
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
                  Create a new documentation page for this project
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#0F172A]">Page Title</label>
                  <Input
                    value={newPageTitle}
                    onChange={(e) => setNewPageTitle(e.target.value)}
                    placeholder="Enter page title..."
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-[#0F172A]">Content</label>
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
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search project wiki pages..."
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
            <FileText className="h-12 w-12 mx-auto text-[#0F172A]/40 mb-4" />
            <h3 className="text-lg font-medium text-[#0F172A] mb-2">
              {searchTerm ? 'No pages found' : 'No wiki pages yet for this project'}
            </h3>
            <p className="text-[#0F172A]/60 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Create your first project wiki page to get started'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPages.map((page) => (
            <Card 
              key={page.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/projects/${projectId}/wiki?id=${page.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-[#4F46E5] flex-shrink-0" />
                  <span className="text-base font-semibold truncate" title={page.title}>{page.title}</span>
                </div>
                <CardAction onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditedContent(page.content || '')
                        setIsEditing(true)
                        setEditingPageId(page.id)
                      }}
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
                </CardAction>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span className="text-xs">Updated: {formatDate(page.updated_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      page.status === 'published' 
                        ? 'bg-[#0F172A]/10 text-[#0F172A]' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {page.status}
                    </span>
                  </div>
                </div>
                
                {/* Content preview or inline editor */}
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                  {isEditing && editingPageId === page.id ? (
                    <div className="space-y-2">
                      <WysiwygEditor
                        content={editedContent}
                        onChange={setEditedContent}
                        placeholder="Edit your page content here..."
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          className="h-6 text-xs"
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="h-6 text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="line-clamp-2 text-gray-600">
                      {stripHtml(page.content || 'No content').slice(0, 100) + (stripHtml(page.content || '').length > 100 ? '...' : '')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
