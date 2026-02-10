"use client"

import * as React from "react"
import { Download, FileText, Trash2, Eye } from "lucide-react"
import { deleteInvoiceAction } from "@/actions/invoices"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

// UPDATED: Added onRefresh prop
export function InvoiceList({ invoices, projectId, organisationName, onRefresh }: { invoices: any[], projectId: string, organisationName?: string, onRefresh?: () => void }) {
  
  const handleDownload = async (url: string, filename: string) => {
    if (!url) return toast.error("File not found");
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Download complete");
    } catch (err) { window.open(url, '_blank'); }
  }

  return (
    <div className="grid grid-cols-1 gap-3 px-2">
      {invoices?.length > 0 ? invoices.map((inv) => (
        <div key={inv.id} className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-[24px] hover:border-[#4F46E5] transition-all group shadow-sm ring-1 ring-slate-50">
          <div className="flex items-center gap-5">
            <div className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-[#0F172A] group-hover:text-white transition-all text-[#0F172A] shadow-sm">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <p className="font-black text-slate-900 text-sm tracking-tight uppercase group-hover:text-[#4F46E5] transition-colors">{inv.invoice_number}</p>
                <Badge className="bg-slate-100 text-slate-500 border-none text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">{inv.status}</Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs">
                 <p className="font-black text-[#0F172A] tracking-tight">${inv.amount?.toLocaleString()}</p>
                 <span className="h-1 w-1 bg-slate-200 rounded-full" />
                 <p className="font-bold text-slate-400 uppercase tracking-tighter">{organisationName || 'Client'}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
            <button onClick={() => window.open(inv.file_url, '_blank')} className="h-10 w-10 flex items-center justify-center bg-slate-50 text-[#0F172A] rounded-xl hover:bg-[#4F46E5] hover:text-white transition-all shadow-sm cursor-pointer active:scale-90"><Eye className="h-4 w-4" /></button>
            <button onClick={() => handleDownload(inv.file_url, `${inv.invoice_number}.pdf`)} className="h-10 px-5 bg-[#0F172A] text-white rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#4F46E5] transition-all shadow-md cursor-pointer active:scale-95">Download</button>
            
            {/* UPDATED: Added await and onRefresh() to clear UI */}
            <button onClick={async () => { 
              if(confirm('Purge record?')) {
                await deleteInvoiceAction(inv.id, projectId, inv.storage_path); 
                toast.success("Purge complete");
                onRefresh?.(); 
              }
            }} className="h-10 w-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )) : (
        <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/20">
          <p className="text-xs text-slate-400 font-black uppercase tracking-widest opacity-60">No financial records</p>
        </div>
      )}
    </div>
  )
}