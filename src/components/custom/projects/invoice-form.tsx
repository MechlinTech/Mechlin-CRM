"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createInvoiceAction } from "@/actions/invoices"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { UploadCloud, FileCheck } from "lucide-react"
import { ActionModalContext } from "@/components/shared/action-button"

export function InvoiceForm({ projectId }: { projectId: string }) {
  const { close } = React.useContext(ActionModalContext);
  const [uploading, setUploading] = React.useState(false)
  
  const form = useForm({
    defaultValues: {
      invoice_number: `INV-${Date.now().toString().slice(-6)}`,
      amount: 0,
      status: "Sent",
      file_url: "",
      storage_path: ""
    }
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${projectId}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('invoices')
      .upload(filePath, file);

    if (error) {
      toast.error("Upload failed: " + error.message);
    } else {
      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(filePath);
      
      form.setValue("file_url", publicUrl);
      form.setValue("storage_path", filePath);
      toast.success("Invoice PDF uploaded");
    }
    setUploading(false);
  }

  async function onSubmit(values: any) {
    const res = await createInvoiceAction(projectId, values);
    if (res.success) {
      toast.success("Invoice record saved");
      close(); // This closes the dialog automatically
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4 text-black">
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="invoice_number" render={({ field }) => (
            <FormItem><FormLabel className="text-[10px] font-bold uppercase text-zinc-400">Invoice Reference</FormLabel>
            <Input {...field} className="bg-white border-zinc-200" /></FormItem>
            )} />
            <FormField control={form.control} name="amount" render={({ field }) => (
            <FormItem><FormLabel className="text-[10px] font-bold uppercase text-zinc-400">Billable Amount</FormLabel>
            <Input type="number" {...field} className="bg-white border-zinc-200" /></FormItem>
            )} />
        </div>
        
        <div className="space-y-2">
          <FormLabel className="text-[10px] font-bold uppercase text-zinc-400">Physical PDF Document</FormLabel>
          <div className="border-2 border-dashed border-zinc-200 rounded-3xl p-8 flex flex-col items-center justify-center bg-zinc-50/50 hover:bg-zinc-50 transition-all cursor-pointer relative group">
             {form.watch("file_url") ? (
                 <>
                    <FileCheck className="h-10 w-10 text-green-500 mb-2" />
                    <p className="text-xs font-bold text-green-600 uppercase">File uploaded successfully</p>
                 </>
             ) : (
                 <>
                    <UploadCloud className="h-10 w-10 text-zinc-300 group-hover:text-black transition-colors mb-2" />
                    <p className="text-xs text-zinc-500 font-medium">Click to upload official invoice PDF</p>
                 </>
             )}
             <input type="file" accept=".pdf" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </div>

        <Button type="submit" disabled={uploading || !form.watch("file_url")} className="w-full bg-black text-white font-black h-14 rounded-2xl shadow-xl hover:bg-zinc-800 transition-all">
          {uploading ? "Uploading PDF..." : "Finalize Invoice"}
        </Button>
      </form>
    </Form>
  )
}