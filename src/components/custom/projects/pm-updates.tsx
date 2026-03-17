"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { WysiwygEditor } from "@/components/shared/wysiwyg-editorPM"
import { Button } from "@/components/ui/button"
import { createPMUpdateAction, updatePMUpdateAction } from "@/actions/pm-updates"
import { toast } from "sonner"
import { useRBAC } from "@/context/rbac-context"

export function PMUpdateDialog({ projectId, log, children, onSuccess }: any) {
  const [open, setOpen] = React.useState(false)
  const [content, setContent] = React.useState(log?.new_value?.content || log?.content || "")
  const [loading, setLoading] = React.useState(false)
  const { hasPermission, loading: rbacLoading } = useRBAC();
  const isEdit = !!log

  React.useEffect(() => {
    if (!open && !isEdit) {
      setContent("");
    }
  }, [open, isEdit]);

  async function handleSave() {
    const permissionNeeded = isEdit ? 'threads.update' : 'threads.create';
    if (!hasPermission(permissionNeeded)) {
        return toast.error("You do not have permission to post/edit updates.");
    }

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

  const canPerformAction = isEdit ? hasPermission('threads.update') : hasPermission('threads.create');
  if (!rbacLoading && !canPerformAction) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      
      {/* FIXED: 
          1. Removed min-h-[42rem] which was forcing overflow.
          2. Kept flex flex-col to keep header/footer at top/bottom.
      */}
      <DialogContent className="max-w-[95vw] sm:max-w-[70vw] w-full max-h-[90vh] bg-white text-black border-none shadow-2xl p-0 overflow-hidden flex flex-col rounded-xl">

        <DialogHeader className="p-6 shrink-0 border-b border-slate-100">
          <DialogTitle className="font-semibold text-base tracking-tight text-[#0F172A]">
            {isEdit ? 'Modify Project Notice' : 'Broadcast New Notice'}
          </DialogTitle>
        </DialogHeader>
        
        {/* FIXED: flex-1 combined with overflow-y-auto ensures the editor 
            scrolls internally if it gets too long, keeping buttons visible.
        */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
          <div className="min-h-[300px]">
            <WysiwygEditor 
              content={content} 
              onChange={setContent} 
              className="w-full" 
            />
          </div>
        </div>

        {/* FOOTER: Kept buttons in the center with justify-center as requested.
            shrink-0 ensures this section is never squashed.
        */}
        <div className="flex items-center justify-center gap-3 p-6 shrink-0 border-t border-slate-100 bg-slate-50/30">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)} 
              className="w-[180px] bg-white border-slate-200 text-slate-600 hover:bg-slate-50 transition-all rounded-xl h-11"
            >
                Cancel
            </Button>
            
            <Button 
              disabled={loading} 
              onClick={handleSave} 
              className="w-[180px] bg-[#006AFF] hover:bg-[#0056cc] text-white transition-all shadow-md rounded-xl h-11"
            >
              {loading ? 'Processing...' : isEdit ? 'Update Broadcast' : 'Post to Notice Board'}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}