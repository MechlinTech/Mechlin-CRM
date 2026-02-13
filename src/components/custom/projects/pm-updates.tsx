"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { WysiwygEditor } from "@/components/shared/wysiwyg-editorPM"
import { Button } from "@/components/ui/button"
import { createPMUpdateAction, updatePMUpdateAction } from "@/actions/pm-updates"
import { toast } from "sonner"

export function PMUpdateDialog({ projectId, log, children, onSuccess }: any) {
  const [open, setOpen] = React.useState(false)
  const [content, setContent] = React.useState(log?.new_value?.content || log?.content || "")
  const [loading, setLoading] = React.useState(false)
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
      onSuccess?.(); 
    } else {
      toast.error(res.error);
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      
      <DialogContent className="max-w-[90vw] sm:max-w-[60vw] w-full max-h-[90vh] min-h-[42rem] bg-white text-black border-none shadow-2xl p-0 overflow-hidden flex flex-col rounded-[24px]">

        <DialogHeader className="p-6 pb-2 shrink-0 border-b border-slate-50">
          {/* Header Typography: SemiBold */}
          <DialogTitle className="font-semibold text-sm tracking-tight text-[#0F172A]">
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

      <div className="flex items-center justify-center gap-3 p-6 shrink-0 border-t border-slate-50 bg-white">
            {/* Secondary Button: White/Outline with brand hover */}
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)} 
              className="w-[180px] "
            >
                Cancel
            </Button>
            
            {/* Primary Button: #006AFF with #99C4FF hover */}
            <Button 
              disabled={loading} 
              onClick={handleSave} 
              className="w-[180px] "
            >
              {loading ? 'Processing...' : isEdit ? 'Update Broadcast' : 'Post to Notice Board'}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}