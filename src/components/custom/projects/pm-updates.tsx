"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { WysiwygEditor } from "../../shared/wysiwyg-editor"
import { Button } from "@/components/ui/button"
import { createPMUpdateAction, updatePMUpdateAction } from "@/actions/pm-updates"
import { toast } from "sonner"

export function PMUpdateDialog({ projectId, log, children }: any) {
  const [open, setOpen] = React.useState(false)
  const [content, setContent] = React.useState(log?.new_data?.content || "")
  const isEdit = !!log

  async function handleSave() {
    const res = isEdit 
      ? await updatePMUpdateAction(log.id, projectId, content)
      : await createPMUpdateAction(projectId, content);

    if (res.success) {
      toast.success(isEdit ? "Notice Updated" : "Notice Posted");
      setOpen(false);
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl bg-white text-black">
        <DialogHeader>
          <DialogTitle className="font-bold">{isEdit ? 'Edit PM Notice' : 'Post '}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <WysiwygEditor 
            content={content} 
            onChange={setContent} 
            placeholder="e.g. Phase 1 must be completed in 2 days..." 
          />
        </div>
        <Button onClick={handleSave} className="w-full bg-black text-white font-bold">
          {isEdit ? 'Update Notice' : 'Post '}
        </Button>
      </DialogContent>
    </Dialog>
  )
}