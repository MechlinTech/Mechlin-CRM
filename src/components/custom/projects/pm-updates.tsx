"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { WysiwygEditor } from "@/components/shared/wysiwyg-editorPM"
import { Button } from "@/components/ui/button"
import { createPMUpdateAction, updatePMUpdateAction } from "@/actions/pm-updates"
import { toast } from "sonner"

export function PMUpdateDialog({ projectId, log, children }: any) {
  const [open, setOpen] = React.useState(false)
  const [content, setContent] = React.useState(log?.new_value?.content || log?.content || "")
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

    const res = isEdit 
      ? await updatePMUpdateAction(log.id, projectId, content)
      : await createPMUpdateAction(projectId, content);

    if (res.success) {
      toast.success(isEdit ? "Notice Updated" : "Notice Posted");
      setContent("");
      setOpen(false); 
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      {/* max-w-4xl + w-full + overflow-hidden prevents the sssssss scaling */}
      <DialogContent className="max-w-4xl w-full bg-white text-black border-none shadow-2xl p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="font-black text-2xl tracking-tighter uppercase">
            {isEdit ? 'Modify Project Notice' : 'Broadcast New Notice'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 w-full max-w-full overflow-hidden">
          <WysiwygEditor 
            content={content} 
            onChange={setContent} 
          />
        </div>

        {/* Footer with forced layout */}
        <div className="flex items-center gap-3 p-6 pt-0 w-full mt-auto">
            <Button variant="outline" onClick={() => setOpen(false)} className="w-[120px] h-12 rounded-xl font-bold uppercase text-xs">
                Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-black text-white font-black h-12 rounded-xl uppercase text-xs hover:bg-zinc-800 transition-colors">
              {isEdit ? 'Update Broadcast' : 'Post to Notice Board'}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}