"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createInvoiceAction } from "@/actions/invoices"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { CloudUpload, FileCheck, X, FileText } from "lucide-react"
import { ActionModalContext } from "@/components/shared/action-button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  url?: string;
  storagePath?: string;
}

export function InvoiceForm({ projectId, onSuccess }: { projectId: string, onSuccess?: () => void }) {
  const { close } = React.useContext(ActionModalContext);
  const [files, setFiles] = React.useState<UploadingFile[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm({
    defaultValues: {
      invoice_number: `INV-${Date.now().toString().slice(-6)}`,
      amount: 0,
      status: "Sent",
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const newEntries = selectedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    setFiles(prev => [...prev, ...newEntries]);

    for (const entry of newEntries) {
      const fileExt = entry.file.name.split('.').pop();
      const filePath = `${projectId}/${Date.now()}-${entry.id}.${fileExt}`;

      const { error } = await supabase.storage
        .from('invoices')
        .upload(filePath, entry.file);

      if (error) {
        toast.error(`Upload failed for ${entry.file.name}`);
        setFiles(prev => prev.map(f => f.id === entry.id ? { ...f, status: 'error' } : f));
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('invoices')
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

  async function onSubmit(values: any) {
    const completedFiles = files.filter(f => f.status === 'completed');
    if (completedFiles.length === 0) return toast.error("Please upload at least one invoice");

    setIsSubmitting(true);
    
    try {
      for (const fileData of completedFiles) {
        await createInvoiceAction(projectId, {
          ...values,
          invoice_number: completedFiles.length > 1 ? `${values.invoice_number}-${fileData.id.slice(0,3)}` : values.invoice_number,
          file_url: fileData.url,
          storage_path: fileData.storagePath
        });
      }
      
      toast.success(`${completedFiles.length} Invoice(s) finalized`);
      onSuccess?.(); 
      close(); 
    } catch (err) {
      toast.error("An error occurred while saving records");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2 text-[#0F172A] font-sans">
        
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 rounded-[32px] p-10 flex flex-col items-center justify-center bg-slate-50/30 hover:bg-white hover:border-[#4F46E5]/50 transition-all cursor-pointer relative group overflow-hidden">
             <div className="bg-slate-100 p-4 rounded-full mb-4 group-hover:bg-[#4F46E5]/10 transition-colors">
                <CloudUpload className="h-10 w-10 text-slate-400 group-hover:text-[#4F46E5]" />
             </div>
             <div className="text-center space-y-1">
                <p className="text-sm font-black tracking-tight">Drop Your File(s) Here</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Or</p>
                <div className="mt-2">
                    <span className="bg-[#0ea5e9] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-sky-600 transition-all shadow-md inline-block">Browse</span>
                </div>
             </div>
             <p className="mt-4 text-[9px] font-bold text-slate-300 uppercase">Maximum File Size 4 MB</p>
             <input type="file" multiple accept=".pdf" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>

          <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
            {files.map((fileEntry) => (
              <div key={fileEntry.id} className="bg-white border border-slate-100 p-3 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3 flex-1">
                      <div className="h-8 w-8 bg-[#0F172A] rounded-lg flex items-center justify-center text-white shrink-0">
                          <FileText className="h-4 w-4" />
                      </div>
                      {/* FIX: Use flex-1 here to let the bar grow to fill the container */}
                      <div className="space-y-1.5 flex-1 pr-4">
                          <p className="text-[11px] font-black truncate max-w-[250px]">{fileEntry.file.name}</p>
                          {/* UPDATED: Changed w-40 to w-full */}
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

        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="invoice_number" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Invoice Reference</FormLabel>
                <FormControl><Input {...field} className="bg-white border-slate-200 rounded-xl text-xs font-bold h-10" /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="amount" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Billable Amount</FormLabel>
                <FormControl><Input type="number" {...field} className="bg-white border-slate-200 rounded-xl text-xs font-bold h-10" /></FormControl>
              </FormItem>
            )} />
        </div>

        <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Current Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-white border-slate-200 rounded-xl text-xs font-bold h-10">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white border-slate-200 rounded-xl shadow-2xl">
                  <SelectItem value="Sent" className="text-xs font-bold">Sent</SelectItem>
                  <SelectItem value="Paid" className="text-xs font-bold">Paid</SelectItem>
                  <SelectItem value="Overdue" className="text-xs font-bold">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
        )} />

        <Button 
          type="submit" 
          disabled={files.length === 0 || files.some(f => f.status === 'uploading') || isSubmitting} 
          className="w-full bg-[#0F172A] text-white font-black h-12 rounded-xl shadow-lg hover:bg-[#4F46E5] transition-all active:scale-95"
        >
          {isSubmitting ? "Processing..." : "Finalize Invoice"}
        </Button>
      </form>
    </Form>
  )
}