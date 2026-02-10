"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { uploadDocumentAction } from "@/actions/documents"
import { toast } from "sonner"
import { CloudUpload, FileCheck, X, FileText } from "lucide-react"
import { ActionModalContext } from "@/components/shared/action-button"
import { cn } from "@/lib/utils"

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  url?: string;
  storagePath?: string;
}

export function DocumentForm({ projectId, ids }: { projectId: string, ids: any }) {
  const { close } = React.useContext(ActionModalContext);
  const [files, setFiles] = React.useState<UploadingFile[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const newEntries = selectedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 10, // Start with a small visual bump
      status: 'uploading' as const
    }));

    setFiles(prev => [...prev, ...newEntries]);

    // Process each file sequentially for storage
    for (const entry of newEntries) {
      const fileExt = entry.file.name.split('.').pop();
      const filePath = `${projectId}/${Date.now()}-${entry.id}.${fileExt}`;

      const { error } = await supabase.storage
        .from('documents')
        .upload(filePath, entry.file);

      if (error) {
        toast.error(`Upload failed for ${entry.file.name}`);
        setFiles(prev => prev.map(f => f.id === entry.id ? { ...f, status: 'error', progress: 100 } : f));
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);
        
        setFiles(prev => prev.map(f => f.id === entry.id ? { 
          ...f, 
          progress: 100, 
          status: 'completed', 
          url: publicUrl, 
          storagePath: filePath 
        } : f));
      }
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const save = async () => {
    const completedFiles = files.filter(f => f.status === 'completed');
    if (completedFiles.length === 0) return toast.error("Please upload at least one document");

    setIsSubmitting(true);
    
    try {
      // Loop through all uploaded files and link them to the project/phase/milestone
      for (const fileData of completedFiles) {
        await uploadDocumentAction(projectId, { 
            name: fileData.file.name, 
            file_url: fileData.url,
            ...ids 
        });
      }
      
      toast.success(`${completedFiles.length} Document(s) submitted successfully`);
      close(); // Auto-close modal
    } catch (err) {
      toast.error("An error occurred while linking documents");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pt-4 text-[#0F172A] font-sans">
      
      {/* MULTI-FILE DROPZONE */}
      <div className="space-y-4">
        <div className="border-2 border-dashed border-slate-200 rounded-[32px] p-10 flex flex-col items-center justify-center bg-slate-50/30 hover:bg-white hover:border-[#4F46E5]/50 transition-all cursor-pointer relative group overflow-hidden">
           <div className="bg-slate-100 p-4 rounded-full mb-4 group-hover:bg-[#4F46E5]/10 transition-colors">
              <CloudUpload className="h-10 w-10 text-slate-400 group-hover:text-[#4F46E5]" />
           </div>
           <div className="text-center space-y-1">
              <p className="text-sm font-black tracking-tight">Drop Your Documents Here</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Or</p>
              <div className="mt-2">
                  <span className="bg-[#0ea5e9] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-sky-600 transition-all shadow-md inline-block">Browse Files</span>
              </div>
           </div>
           <p className="mt-4 text-[9px] font-bold text-slate-300 uppercase">Supports Multiple Files</p>
           <input type="file" multiple onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
        </div>

        {/* FILE PROGRESS LIST */}
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
          {files.map((fileEntry) => (
            <div key={fileEntry.id} className="bg-white border border-slate-100 p-3 rounded-2xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3 flex-1">
                    <div className="h-8 w-8 bg-[#0F172A] rounded-lg flex items-center justify-center text-white shrink-0">
                        <FileText className="h-4 w-4" />
                    </div>
                    <div className="space-y-1.5 flex-1 pr-4">
                        <p className="text-[11px] font-black truncate max-w-[250px]">{fileEntry.file.name}</p>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full transition-all duration-500 ease-out", 
                                fileEntry.status === 'completed' ? "bg-emerald-500" : "bg-sky-500",
                                fileEntry.status === 'error' && "bg-red-500"
                              )} 
                              style={{ width: `${fileEntry.progress}%` }}
                            />
                        </div>
                    </div>
                </div>
                <button type="button" onClick={() => removeFile(fileEntry.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1 shrink-0">
                    <X className="h-4 w-4" />
                </button>
            </div>
          ))}
        </div>
      </div>

      <Button 
        onClick={save} 
        disabled={files.length === 0 || files.some(f => f.status === 'uploading') || isSubmitting} 
        className="w-full bg-black text-white font-black h-14 rounded-2xl uppercase text-xs shadow-xl tracking-tighter hover:bg-[#4F46E5] transition-all"
      >
        {isSubmitting ? "Linking Documents..." : "Complete Submission"}
      </Button>
    </div>
  );
}