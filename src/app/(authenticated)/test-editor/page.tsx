"use client"

import { useState } from 'react'
import { WysiwygEditor } from '@/components/shared/wysiwyg-editor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestEditorPage() {
  const [content, setContent] = useState('<p>Start writing your wiki content here...</p>')

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">WYSIWYG Editor Test</h1>
        <p className="text-gray-600">Test your new rich text editor component</p>
      </div>

      <div className="grid gap-6">
        {/* Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Wiki Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <WysiwygEditor
              content={content}
              onChange={setContent}
              placeholder="Write your wiki content here..."
            />
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>HTML Output (What gets saved to database)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded border">
              <pre className="text-sm overflow-auto max-h-40">
                {content}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Rendered Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Rendered Preview (How users see it)</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="prose prose-sm max-w-none p-4 border rounded"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button onClick={() => setContent('<p>Content reset!</p>')}>
              Reset Content
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigator.clipboard.writeText(content)}
            >
              Copy HTML to Clipboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
