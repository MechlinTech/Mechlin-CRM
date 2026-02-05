"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { WysiwygEditor } from '@/components/shared/wysiwyg-editor'
import { 
  getWikiPageByIdAction,
  updateWikiPageAction,
  deleteWikiPageAction,
  getWikiPageVersionsAction,
} from '@/actions/wiki'
import type { WikiPage } from '@/data/wiki'
import { getUserById } from '@/data/user'
import { 
  ArrowLeft, 
  Edit, 
  Trash2,
  Save,
  X,
  Calendar,
  User
} from 'lucide-react'

export default function WikiPageView() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [page, setPage] = useState<WikiPage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [versions, setVersions] = useState<any[]>([])
  const [creatorName, setCreatorName] = useState<string>('Unknown')

  useEffect(() => {
    // Check if we're in edit mode from URL params
    const editMode = searchParams.get('edit') === 'true'
    setIsEditing(editMode)
    
    const pageId = searchParams.get('id')
    if (pageId) {
      loadPage(pageId)
    }
  }, [searchParams])

  const loadPage = async (pageId: string) => {
    setIsLoading(true)
    try {
      const result = await getWikiPageByIdAction(pageId)
      if (result.success && result.page) {
        setPage(result.page)
        setEditedContent(result.page.content || '')
        
        // Fetch user details if created_by exists
        if (result.page.created_by) {
          const userResult = await getUserById(result.page.created_by)
          if (userResult.data && userResult.data.name) {
            setCreatorName(userResult.data.name)
          }
        }
      } else {
        toast.error('Failed to load wiki page')
        router.back()
      }
    } catch (error) {
      toast.error('Error loading wiki page')
      router.back()
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!page) return

    setIsSaving(true)
    try {
      const result = await updateWikiPageAction(page.id, {
        content: editedContent,
        title: page.title,
        status: page.status
      })

      if (result.success) {
        toast.success('Page updated successfully!')
        setIsEditing(false)
        loadPage(page.id) // Reload to get latest data
      } else {
        toast.error(result.error || 'Failed to update page')
      }
    } catch (error) {
      toast.error('Error updating page')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!page) return

    try {
      const result = await deleteWikiPageAction(page.id)
      if (result.success) {
        toast.success('Page deleted successfully!')
        router.back()
      } else {
        toast.error(result.error || 'Failed to delete page')
      }
    } catch (error) {
      toast.error('Error deleting page')
    }
  }

  const loadVersions = async () => {
    if (!page) return

    try {
      const result = await getWikiPageVersionsAction(page.id)
      if (result.success && result.versions) {
        setVersions(result.versions)
      } else {
        toast.error('Failed to load page history')
      }
    } catch (error) {
      toast.error('Error loading page history')
    }
  }

  useEffect(() => {
    if (showHistoryDialog && page) {
      loadVersions()
    }
  }, [showHistoryDialog, page])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading wiki page...</div>
        </div>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Page not found</h1>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Back Button - Top Left */}
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Project
          </Button>
        </div>

        {/* Header - Thinner */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
            {/* Left Section - Title and Metadata */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2 break-words">{page.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Created by {creatorName}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Updated {formatDate(page.updated_at)}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  page.status === 'published' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {page.status}
                </span>
              </div>
            </div>
            
            {/* Right Section - Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 lg:flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistoryDialog(true)}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                History
              </Button>
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false)
                      setEditedContent(page.content || '')
                    }}
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
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-600 focus:bg-red-50 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Content</h2>
          </div>
          <div className="p-6">
            {isEditing ? (
              <div className="space-y-4">
                <WysiwygEditor
                  content={editedContent}
                  onChange={setEditedContent}
                  placeholder="Edit your page content here..."
                />
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setEditedContent(page.content || '')
                    }}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: page.content || '<p class="text-gray-500">No content available</p>' }}
              />
            )}
          </div>
        </div>

        {/* History Dialog */}
        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="!max-w-[900px] !w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Page History</DialogTitle>
              <DialogDescription>
                View and restore previous versions of this wiki page
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {versions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No history available</p>
              ) : (
                versions.map((version: any, index: number) => (
                  <div key={version.id} className="border rounded-lg p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-lg">
                          {versions.length === 1 ? 'Previous Version' : `Version ${versions.length - index}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(version.created_at)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {version.changes_summary || 'No summary provided'}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditedContent(version.content)
                          setIsEditing(true)
                          setShowHistoryDialog(false)
                          toast.info('Loaded previous version. Edit and save to restore.')
                        }}
                      >
                        Restore
                      </Button>
                    </div>
                    {/* Content Preview */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-3">Content Preview:</p>
                      <div 
                        className="text-sm prose prose-sm max-w-none overflow-auto max-h-96"
                        dangerouslySetInnerHTML={{ 
                          __html: version.content || '<p class="text-gray-400">No content</p>' 
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Wiki Page</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{page.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleDelete}
                className="bg-red-600 text-white hover:bg-red-700 focus:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
