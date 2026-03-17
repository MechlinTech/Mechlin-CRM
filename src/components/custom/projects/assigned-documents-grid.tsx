"use client"

import * as React from "react"
import { supabase } from "@/lib/supabase"
import { FileText, PenTool, Calendar, CheckCircle2 } from "lucide-react"
import dynamic from "next/dynamic"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"

const PDFSignerModal = dynamic(() => import("./pdf-signer-modal"), { ssr: false })

// Added filter props to the component
export function AssignedDocumentsGrid({ 
  projectId, 
  searchTerm,
  phaseId,
  milestoneId,
  sprintId,
  sortOrder 
}: { 
  projectId: string, 
  searchTerm: string,
  phaseId?: string,
  milestoneId?: string,
  sprintId?: string,
  sortOrder?: string 
}) {
  const [items, setItems] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [signingDoc, setSigningDoc] = React.useState<any>(null)

  const fetchAssigned = React.useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser();
    
    let query = supabase
      .from("document_signers")
      .select("*, documents(*)")
      .eq("user_id", user?.id)
    
    // Applying Filters to the query
    if (sprintId) query = query.eq("documents.sprint_id", sprintId)
    else if (milestoneId) query = query.eq("documents.milestone_id", milestoneId)
    else if (phaseId) query = query.eq("documents.phase_id", phaseId)

    const { data } = await query;
    
    // CUSTOM SORTING LOGIC:
    // 1. Pending docs come first, Signed come last.
    // 2. Within Pending: Newest (created_at) first.
    // 3. Within Signed: Newest (signed_at) first.
    const sortedData = (data || []).sort((a, b) => {
      if (a.status === 'pending' && b.status === 'signed') return -1;
      if (a.status === 'signed' && b.status === 'pending') return 1;
      
      // If statuses are the same, sort by date
      const dateA = a.status === 'signed' ? new Date(a.signed_at).getTime() : new Date(a.created_at).getTime();
      const dateB = b.status === 'signed' ? new Date(b.signed_at).getTime() : new Date(b.created_at).getTime();
      
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    setItems(sortedData)
    setLoading(false)
  }, [phaseId, milestoneId, sprintId, sortOrder])

  React.useEffect(() => { fetchAssigned() }, [fetchAssigned])

  const filtered = items.filter(item => 
    item.documents?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="py-20 text-center text-xs text-slate-400 font-semibold uppercase tracking-widest">Loading assignments...</div>

  return (
  <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-500">
      {filtered.length > 0 ? filtered.map((item) => {
        const doc = item.documents;
        const isSigned = item.status === 'signed';

        return (
          <div key={item.id} className={`group bg-white border ${isSigned ? 'border-emerald-100 bg-emerald-50/10' : 'border-slate-200'} rounded-[24px] p-4 shadow-sm flex flex-col justify-between hover:border-emerald-200 transition-all ring-1 ring-slate-50`}>
            <div>
              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-4 transition-all shadow-sm ${
                isSigned ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-600 group-hover:text-white'
              }`}>
                <FileText className="h-7 w-7" />
              </div>
              
              <h3 className="font-semibold text-xs text-slate-800 line-clamp-2 mb-1 tracking-tight">
                {doc?.name}
              </h3>

             <div className="flex items-center gap-2 mb-4">
              {isSigned ? (
                <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1 uppercase tracking-tighter">
                  <CheckCircle2 className="h-3 w-3" /> Signed on {item.signed_at ? format(new Date(item.signed_at), "MMM d, yyyy") : 'Recently'}
                </span>
              ) : (
                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 uppercase tracking-tighter">
                  <Calendar className="h-3 w-3" /> Waiting for your sign
                </span>
              )}
            </div>
          </div>

          {isSigned ? (
            <Button
              onClick={() => window.open(doc.file_url, "_blank")}
              variant="outline"
              size="sm"
              // Added text-[10px] to ensure text fits, and min-w-0 to handle flex overflow
              className="w-full shrink-0 whitespace-nowrap text-[10px] px-2"
            >
              View Signed Doc
            </Button>
          ) : (
            <Button
              onClick={() => setSigningDoc({ id: doc.id, name: doc.name, url: doc.file_url })}
              variant="default"
              size="sm" // Changed from default to sm to reduce height/padding
              // Added text-[10px], gap-1.5, and px-2 for a more compact fit
              className="w-full shrink-0 whitespace-nowrap gap-1.5 text-[10px] px-2"
            >
              <PenTool className="h-3.5 w-3.5" /> Sign Document
            </Button>
)}
          </div>
        )
      }) : (
        <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/20">
          <p className="text-xs text-slate-400 font-black uppercase tracking-widest opacity-60">
            No assignment history found
          </p>
        </div>
      )}

      {signingDoc && (
        <PDFSignerModal 
           isOpen={!!signingDoc} 
           onClose={() => setSigningDoc(null)} 
           documentId={signingDoc.id} 
           documentName={signingDoc.name} 
           pdfUrl={signingDoc.url} 
           onSignComplete={() => { 
             setSigningDoc(null); 
             fetchAssigned(); 
           }} 
        />
      )}
    </div>
  )
}