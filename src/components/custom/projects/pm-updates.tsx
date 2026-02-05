"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { WysiwygEditor } from "@/components/shared/wysiwyg-editorPM"
import { Button } from "@/components/ui/button"
import { createPMUpdateAction, updatePMUpdateAction } from "@/actions/pm-updates"
import { toast } from "sonner"

export function PMUpdateDialog({ projectId, log, children }: any) {
  const [open, setOpen] = React.useState(false)
  const [content, setContent] = React.useState(log?.new_data?.content || log?.content || "")
  const isEdit = !!log

  async function handleSave() {
    const res = isEdit 
      ? await updatePMUpdateAction(log.id, projectId, content)
      : await createPMUpdateAction(projectId, content);

    if (res.success) {
      toast.success(isEdit ? "Notice Updated" : "Notice Posted");
      setOpen(false); // FIXED: Auto-closes the dialog
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl bg-white text-black border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-black text-xl">{isEdit ? 'Edit PM Notice' : 'Post New PM Notice'}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <WysiwygEditor 
            content={content} 
            onChange={setContent} 
            placeholder="Write your project notice here..." 
          />
        </div>
        <Button onClick={handleSave} className="w-full bg-black text-white font-black h-12">
          {isEdit ? 'Update Notice' : 'Post to Notice Board'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}