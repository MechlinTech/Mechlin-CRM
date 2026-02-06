"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { uploadDocumentAction } from "@/actions/documents"
import { toast } from "sonner"
import { UploadCloud, FileCheck } from "lucide-react"
import { ActionModalContext } from "@/components/shared/action-button"

export function DocumentForm({ projectId, ids }: { projectId: string, ids: any }) {
  const { close } = React.useContext(ActionModalContext);
  const [uploading, setUploading] = React.useState(false);
  const [fileData, setFileData] = React.useState({ name: "", url: "" });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from('documents').upload(`${projectId}/${fileName}`, file);

    if (error) {
      toast.error(error.message);
    } else {
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(`${projectId}/${fileName}`);
      setFileData({ name: file.name, url: publicUrl });
      toast.success("File uploaded to storage");
    }
    setUploading(false);
  };

  const save = async () => {
    const res = await uploadDocumentAction(projectId, { 
        name: fileData.name, 
        file_url: fileData.url,
        ...ids 
    });
    if (res.success) { 
        close(); // Auto-close modal
        toast.success("Document linked successfully"); 
    }
  };

  return (
    <div className="space-y-6 pt-4 text-black">
      <div className="border-2 border-dashed border-zinc-200 rounded-[32px] p-12 flex flex-col items-center justify-center bg-zinc-50 relative hover:bg-zinc-100 transition-all cursor-pointer">
        {fileData.url ? <FileCheck className="h-12 w-12 text-green-500 mb-3" /> : <UploadCloud className="h-12 w-12 text-zinc-300 mb-3" />}
        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">{fileData.name || "Select Deliverable"}</p>
        <input type="file" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer" />
      </div>
      <Button onClick={save} disabled={!fileData.url || uploading} className="w-full bg-black text-white font-black h-14 rounded-2xl uppercase text-xs shadow-xl tracking-tighter">
        {uploading ? "Uploading..." : "Complete Submission"}
      </Button>
    </div>
  );
}