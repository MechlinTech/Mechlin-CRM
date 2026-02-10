// src/components/custom/projects/pm-updates.tsx
"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { WysiwygEditor } from "@/components/shared/wysiwyg-editorPM"
import { Button } from "@/components/ui/button"
import { createPMUpdateAction, updatePMUpdateAction } from "@/actions/pm-updates"
import { toast } from "sonner"

// UPDATED: Added onSuccess to the destructured props
export function PMUpdateDialog({ projectId, log, children, onSuccess }: any) {
  const [open, setOpen] = React.useState(false)
  const [content, setContent] = React.useState(log?.new_value?.content || log?.content || "")
  const [loading, setLoading] = React.useState(false) // Added loading state for better UX
  const isEdit = !!log

  React.useEffect(() => {
    if (!open && !isEdit) {
      setContent("");
    }
  }, [open, isEdit]);

  async function handleSave() {
    if (!content || content === "<p></p>") {
        return toast.error("Notice content cannot be empty");
    }

    setLoading(true)
    const res = isEdit 
      ? await updatePMUpdateAction(log.id, projectId, content)
      : await createPMUpdateAction(projectId, content);

    if (res.success) {
      toast.success(isEdit ? "Notice Updated" : "Notice Posted");
      setContent("");
      setOpen(false); 
      // UPDATED: Call the refresh function passed from the parent
      onSuccess?.(); 
    } else {
      toast.error(res.error);
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      
      <DialogContent className="max-w-[90vw] sm:max-w-[60vw] w-full max-h-[90vh] min-h-[42rem] bg-white text-black border-none shadow-2xl p-0 overflow-hidden flex flex-col">
 
        <DialogHeader className="p-6 pb-2 shrink-0">
          <DialogTitle className="font-black text-sm tracking-tighter uppercase">
            {isEdit ? 'Modify Project Notice' : 'Broadcast New Notice'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 pt-2 min-h-0">
          <WysiwygEditor 
            content={content} 
            onChange={setContent} 
            className="w-full" 
          />
        </div>

        <div className="flex items-center gap-3 p-6 shrink-0 border-t border-slate-50 bg-white">
            <Button variant="outline" onClick={() => setOpen(false)} className="w-[120px] h-12 rounded-xl font-bold uppercase text-[10px]">
                Cancel
            </Button>
            {/* UPDATED: Added disabled state while loading */}
            <Button disabled={loading} onClick={handleSave} className="flex-1 bg-black text-white font-black h-12 rounded-xl uppercase text-[10px] hover:bg-zinc-800 transition-colors">
              {loading ? 'Processing...' : isEdit ? 'Update Broadcast' : 'Post to Notice Board'}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}