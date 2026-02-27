// src/components/custom/projects/document-form.tsx
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { uploadDocumentAction } from "@/actions/documents"
import { toast } from "sonner"
import { CloudUpload, X, FileText, Plus, Check } from "lucide-react"
import { ActionModalContext } from "@/components/shared/action-button"  
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function DocumentForm({ projectId, ids }: { projectId: string, ids: any }) {
  const { close } = React.useContext(ActionModalContext);
  const [files, setFiles] = React.useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Dynamic Document Types
  const [docType, setDocType] = React.useState<string>("");
  const [isAddingNewType, setIsAddingNewType] = React.useState(false);
  const [newTypeName, setNewTypeName] = React.useState("");
  const [existingTypes, setExistingTypes] = React.useState<string[]>([]);

  // Fetch unique types already in the DB
const fetchExistingTypes = React.useCallback(async () => {
    const { data, error } = await supabase
      .from('documents')
      .select('doc_type')
      .not('doc_type', 'is', null);
    
    if (!error && data) {
      const uniqueTypes = Array.from(new Set(data.map(d => d.doc_type)))
        .filter(Boolean) as string[];
      setExistingTypes(uniqueTypes);
    }
  }, []);

  React.useEffect(() => {
    fetchExistingTypes();
  }, [fetchExistingTypes]);

  React.useEffect(() => {
    fetchExistingTypes();
  }, [fetchExistingTypes]);

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

  const save = async () => {
    const completedFiles = files.filter(f => f.status === 'completed');
    if (completedFiles.length === 0) return toast.error("Please upload at least one document");
    if (!docType) return toast.error("Please select or create a document type");
    
    setIsSubmitting(true);
    try {
      for (const fileData of completedFiles) {
        await uploadDocumentAction(projectId, { 
          name: fileData.file.name, 
          file_url: fileData.url, 
          doc_type: docType, 
          ...ids 
        });
      }
      toast.success("Documents submitted successfully");
      close();
    } catch (err) {
      toast.error("An error occurred");
    } finally { setIsSubmitting(false); }
  };
const handleAddNewType = () => {
    if (!newTypeName.trim()) {
      setIsAddingNewType(false);
      return;
    }
    
    const formattedType = newTypeName.trim();
    
    if (!existingTypes.includes(formattedType)) {
      setExistingTypes(prev => [...prev, formattedType]);
    }

    setDocType(formattedType);
    setNewTypeName("");
    setIsAddingNewType(false);
  };

  return (
    <div className="space-y-6 pt-2 text-[#0F172A] font-sans">
     <div className="space-y-2 px-1">
        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Document Category</label>
        <div className="flex gap-2">
          {!isAddingNewType ? (
            <div className="flex-1 flex gap-2">
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="bg-white border-slate-200 rounded-xl h-10 text-xs font-medium">
                  <SelectValue placeholder="Select existing type..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 rounded-xl shadow-xl">
                  {existingTypes.length > 0 ? (
                    existingTypes.map(type => (
                      <SelectItem key={type} value={type} className="text-xs">{type}</SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-[10px] text-slate-400 text-center">No types created yet</div>
                  )}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon" 
                type="button" // Prevent accidental form submission
                className="rounded-xl border-slate-200 shrink-0 hover:text-[#006AFF] hover:border-[#006AFF]"
                onClick={() => setIsAddingNewType(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex gap-2 animate-in fade-in zoom-in-95 duration-200">
              <Input 
                autoFocus
                placeholder="Type name (e.g. Project Doc)" 
                className="bg-white border-slate-200 rounded-xl h-10 text-xs font-medium"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                onKeyDown={(e) => {
                  if(e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewType();
                  }
                }}
              />
              <Button 
                type="button"
                className="bg-[#006AFF] rounded-xl text-[10px] font-bold h-10 px-4"
                onClick={handleAddNewType}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button 
                type="button"
                variant="ghost" 
                className="h-10 text-slate-400 text-[10px] uppercase font-bold" 
                onClick={() => setIsAddingNewType(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
        {/* REMOVED the "Selected: {docType}" paragraph from here */}
      </div>

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

        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
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
                <button onClick={() => setFiles(prev => prev.filter(f => f.id !== fileEntry.id))} className="text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={save} disabled={files.length === 0 || !docType || isSubmitting} className="w-full bg-[#006AFF] text-white font-semibold h-14 rounded-2xl text-xs hover:bg-[#99C4FF] transition-all cursor-pointer active:scale-95">
        {isSubmitting ? "Linking Documents..." : "Complete Submission"}
      </Button>
    </div>
  );
}