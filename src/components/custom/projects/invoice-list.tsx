"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Download, FileText, Trash2 } from "lucide-react"
import { deleteInvoiceAction } from "@/actions/invoices"
import { toast } from "sonner"

export function InvoiceList({ 
  invoices, 
  projectId, 
  organisationName 
}: { 
  invoices: any[], 
  projectId: string, 
  organisationName?: string 
}) {
  
  const handleDownload = (url: string) => {
    if (!url) return toast.error("No file URL found");
    window.open(url, '_blank');
  }

  return (
    <div className="space-y-4">
      {invoices?.length > 0 ? invoices.map((inv) => (
        <div key={inv.id} className="flex items-center justify-between p-6 bg-white border border-zinc-200 rounded-[24px] shadow-sm hover:border-black transition-all">
          <div className="flex items-center gap-6">
            <div className="h-14 w-14 bg-zinc-100 rounded-2xl flex items-center justify-center">
              <FileText className="h-7 w-7 text-zinc-900" />
            </div>
            <div>
              <p className="font-black text-xl uppercase tracking-tighter text-zinc-900">{inv.invoice_number}</p>
              <div className="flex items-center gap-3">
                 <p className="text-xs text-zinc-400 font-bold">${inv.amount?.toLocaleString()}</p>
                 <span className="h-1 w-1 bg-zinc-200 rounded-full" />
                 <p className="text-[10px] font-black uppercase text-orange-500">{inv.status}</p>
                 {organisationName && (
                   <>
                     <span className="h-1 w-1 bg-zinc-200 rounded-full" />
                     <p className="text-[10px] font-bold text-zinc-400 uppercase">{organisationName}</p>
                   </>
                 )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
                variant="outline" 
                size="sm" 
                className="h-11 px-6 rounded-xl font-bold gap-2 border-zinc-200 hover:bg-black hover:text-white transition-all"
                onClick={() => handleDownload(inv.file_url)}
            >
              <Download className="h-4 w-4" /> Download
            </Button>
            <button 
                onClick={async () => { 
                    const res = await deleteInvoiceAction(inv.id, projectId, inv.storage_path); 
                    if(res.success) toast.success("Invoice record purged");
                }}
                className="h-11 w-11 flex items-center justify-center text-zinc-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      )) : (
        <div className="text-center py-16 border-2 border-dashed border-zinc-100 rounded-[32px] bg-zinc-50/30">
          <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest">No financial documents linked</p>
        </div>
      )}
    </div>
  )
}