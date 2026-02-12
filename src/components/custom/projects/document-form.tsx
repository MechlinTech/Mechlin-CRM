"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { uploadDocumentAction } from "@/actions/documents"
import { toast } from "sonner"
import { CloudUpload, FileCheck, X, FileText } from "lucide-react"
import { ActionModalContext } from "@/components/shared/action-button"
import { cn } from "@/lib/utils"

export function DocumentForm({ projectId, ids }: { projectId: string, ids: any }) {
  const { close } = React.useContext(ActionModalContext);
  const [files, setFiles] = React.useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const newEntries = selectedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 10,
      status: 'uploading' as const
    }));

    setFiles(prev => [...prev, ...newEntries]);

    for (const entry of newEntries) {
      const fileExt = entry.file.name.split('.').pop();
      const filePath = `${projectId}/${Date.now()}-${entry.id}.${fileExt}`;

      const { error } = await supabase.storage.from('documents').upload(filePath, entry.file);

      if (error) {
        toast.error(`Upload failed for ${entry.file.name}`);
        setFiles(prev => prev.map(f => f.id === entry.id ? { ...f, status: 'error', progress: 100 } : f));
      } else {
        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);
        setFiles(prev => prev.map(f => f.id === entry.id ? { ...f, progress: 100, status: 'completed', url: publicUrl } : f));
      }
    }
  };

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));

  const save = async () => {
    const completedFiles = files.filter(f => f.status === 'completed');
    if (completedFiles.length === 0) return toast.error("Please upload at least one document");
    setIsSubmitting(true);
    try {
      for (const fileData of completedFiles) {
        await uploadDocumentAction(projectId, { name: fileData.file.name, file_url: fileData.url, ...ids });
      }
      toast.success(`${completedFiles.length} Document(s) submitted successfully`);
      close();
    } catch (err) {
      toast.error("An error occurred");
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="space-y-6 pt-2 text-[#0F172A] font-sans">
      <div className="space-y-4">
        <div className="border-2 border-dashed border-slate-200 rounded-[32px] p-6 md:p-10 flex flex-col items-center justify-center bg-slate-50/30 hover:bg-white hover:border-[#006AFF]/50 transition-all cursor-pointer relative group overflow-hidden">
           <div className="bg-slate-100 p-4 rounded-full mb-4 group-hover:bg-[#006AFF]/10 transition-colors">
              <CloudUpload className="h-10 w-10 text-slate-400 group-hover:text-[#006AFF]" />
           </div>
           <div className="text-center space-y-1">
              <p className="text-sm font-semibold tracking-tight text-[#1F2937]">Drop Your Documents Here</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">Or</p>
              <div className="mt-2">
                  <span className="bg-[#006AFF] text-white px-6 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-widest hover:bg-[#99C4FF] transition-all shadow-md inline-block">Browse Files</span>
              </div>
           </div>
           <input type="file" multiple onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
        </div>

        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
          {files.map((fileEntry) => (
            <div key={fileEntry.id} className="bg-white border border-slate-100 p-3 rounded-2xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3 flex-1">
                    <div className="h-8 w-8 bg-[#006AFF]/10 rounded-lg flex items-center justify-center text-[#006AFF] shrink-0">
                        <FileText className="h-4 w-4" />
                    </div>
                    <div className="space-y-1.5 flex-1 pr-4">
                        <p className="text-[11px] font-semibold text-[#1F2937] truncate">{fileEntry.file.name}</p>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={cn("h-full transition-all duration-500", fileEntry.status === 'completed' ? "bg-[#006AFF]" : "bg-sky-400")} style={{ width: `${fileEntry.progress}%` }} />
                        </div>
                    </div>
                </div>
                <button onClick={() => removeFile(fileEntry.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={save} disabled={files.length === 0 || isSubmitting} className="w-full bg-[#006AFF] text-white font-semibold h-14 rounded-2xl text-xs hover:bg-[#99C4FF] transition-all cursor-pointer active:scale-95">
        {isSubmitting ? "Linking Documents..." : "Complete Submission"}
      </Button>
    </div>
  );
}