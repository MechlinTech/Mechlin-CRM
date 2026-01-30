"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { WysiwygEditor } from '@/components/shared/wysiwyg-editor'
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
import { 
  getWikiPageByIdAction, 
  updateWikiPageAction, 
  deleteWikiPageAction,
  getWikiPageVersionsAction
} from '@/actions/wiki'
import type { WikiPage } from '@/data/wiki'
import { 
  Edit, 
  Save, 
  X, 
  History, 
  Trash2,
  ArrowLeft,
  FileText
} from 'lucide-react'

interface WikiPageComponentProps {
  pageId?: string
}

export function WikiPageComponent({ pageId: propPageId }: WikiPageComponentProps) {
  const params = useParams()
  const router = useRouter()
  const pageId = propPageId || params.id as string
  
  const [page, setPage] = useState<WikiPage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [editedTitle, setEditedTitle] = useState('')
  const [editedSlug, setEditedSlug] = useState('')
  const [showVersions, setShowVersions] = useState(false)
  const [versions, setVersions] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (pageId) {
      loadPage()
    }
  }, [pageId])

  const loadPage = async () => {
    setIsLoading(true)
    try {
      const result = await getWikiPageByIdAction(pageId)
      if (result.success && result.page) {
        setPage(result.page)
        setEditedContent(result.page.content)
        setEditedTitle(result.page.title)
        setEditedSlug(result.page.slug)
      } else {
        toast.error('Failed to load page')
      }
    } catch (error) {
      toast.error('Error loading page')
    } finally {
      setIsLoading(false)
    }
  }

  const loadVersions = async () => {
    try {
      const result = await getWikiPageVersionsAction(pageId)
      if (result.success && result.versions) {
        setVersions(result.versions)
      }
    } catch (error) {
      toast.error('Failed to load versions')
    }
  }

  const handleSave = async () => {
    if (!page) return
    
    setIsSaving(true)
    try {
      const result = await updateWikiPageAction(pageId, {
        title: editedTitle,
        content: editedContent,
        slug: editedSlug,
        changes_summary: 'Page updated via editor'
      })

      if (result.success) {
        toast.success('Page saved successfully!')
        setIsEditing(false)
        loadPage() // Reload to get latest data
      } else {
        toast.error(result.error || 'Failed to save page')
      }
    } catch (error) {
      toast.error('Error saving page')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!page || !confirm('Are you sure you want to delete this page?')) return
    
    try {
      const result = await deleteWikiPageAction(pageId)
      if (result.success) {
        toast.success('Page deleted successfully!')
        router.push('/wiki')
      } else {
        toast.error(result.error || 'Failed to delete page')
      }
    } catch (error) {
      toast.error('Error deleting page')
    }
  }

  const handleViewVersions = () => {
    setShowVersions(true)
    loadVersions()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading page...</div>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Page not found</div>
      </div>
    )
  }

  return (
    <div className="w-full p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 flex-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/wiki')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Wiki
          </Button>
          
          {isEditing ? (
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="text-2xl font-bold border-none p-0 focus-visible:ring-0 flex-1 max-w-2xl"
              placeholder="Page title"
            />
          ) : (
            <h1 className="text-3xl font-bold text-gray-900">{page.title}</h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
            page.status === 'published' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {page.status}
          </span>

          {isEditing ? (
            <>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                size="sm"
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false)
                  setEditedContent(page.content)
                  setEditedTitle(page.title)
                  setEditedSlug(page.slug)
                }}
                size="sm"
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              
              <Dialog open={showVersions} onOpenChange={setShowVersions}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    onClick={handleViewVersions}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <History className="h-4 w-4" />
                    History
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Page History</DialogTitle>
                    <DialogDescription>
                      View previous versions of this page
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {versions.map((version, index) => (
                      <Card key={version.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {version.changes_summary || 'No summary'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(version.created_at).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-400">
                                By: System
                              </p>
                            </div>
                            <div className="text-xs text-gray-400">
                              Version {versions.length - index}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              <Button 
                variant="destructive" 
                onClick={handleDelete}
                size="sm"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Slug (only show when editing) */}
      {isEditing && (
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700">URL Slug:</label>
          <Input
            value={editedSlug}
            onChange={(e) => setEditedSlug(e.target.value)}
            placeholder="url-slug"
            className="mt-1 max-w-md"
          />
        </div>
      )}

      {/* Content */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Page Content
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isEditing ? (
            <div className="border-0">
              <WysiwygEditor
                content={editedContent}
                onChange={setEditedContent}
                placeholder="Write your wiki content here..."
                className="min-h-[400px]"
              />
            </div>
          ) : (
            <div 
              className="prose prose-sm max-w-none p-6 min-h-[400px]"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          )}
        </CardContent>
      </Card>

      {/* Page Info */}
      <div className="mt-6 text-sm text-gray-500 border-t pt-4">
        <div className="flex gap-6">
          <p>Created: {new Date(page.created_at).toLocaleString()}</p>
          <p>Updated: {new Date(page.updated_at).toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
