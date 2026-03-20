"use client"

import * as React from "react"
import { supabase } from "@/lib/supabase"
import { FileText, ArrowLeft, Calendar, ArrowUpDown, Eye, Search, Filter, PenTool } from "lucide-react"
import Link from "next/link"
import { deleteDocumentAction } from "@/actions/documents"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { useRBAC } from "@/context/rbac-context"
import dynamic from "next/dynamic"
import { RequestSignatureModal } from "@/components/custom/projects/request-signature-modal"
import { AssignedDocumentsGrid } from "@/components/custom/projects/assigned-documents-grid"
import { cn } from "@/lib/utils"
import { ConfirmDeleteModal } from "@/components/shared/confirm-delete-modal"

const PDFSignerModal = dynamic(
  () => import("@/components/custom/projects/pdf-signer-modal"),
  { ssr: false }
)

export default function ProjectDocumentsPage({ params }: { params: any }) {
  const { id } = React.use(params) as any
  const router = useRouter()
  const searchParams = useSearchParams()

  const phaseId = searchParams.get("phaseId") || ""
  const milestoneId = searchParams.get("milestoneId") || ""
  const sprintId = searchParams.get("sprintId") || ""
  const sortOrder = searchParams.get("sort") || "desc"

  const { hasPermission, loading: rbacLoading } = useRBAC()

  const [docs, setDocs] = React.useState<any[]>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [phases, setPhases] = React.useState<any[]>([])
  const [milestones, setMilestones] = React.useState<any[]>([])
  const [sprints, setSprints] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [signingDoc, setSigningDoc] = React.useState<{ id: string, name: string, url: string } | null>(null)
 // Use the 'tab' search param to determine the initial active tab
const [activeTab, setActiveTab] = React.useState<"all" | "assigned">(
  searchParams.get("tab") === "assigned" ? "assigned" : "all"
);

// Sync tab state with URL parameters
React.useEffect(() => {
  const tab = searchParams.get("tab");
  if (tab === "assigned") {
    setActiveTab("assigned");
  } else {
    setActiveTab("all");
  }
}, [searchParams]); // This triggers whenever the URL changes


  const pushParams = React.useCallback(
    (next: Record<string, string>) => {
      const p = new URLSearchParams(searchParams.toString())
      Object.entries(next).forEach(([k, v]) => {
        if (!v) p.delete(k)
        else p.set(k, v)
      })
      router.push(`/projects/${id}/documents?${p.toString()}`)
    },
    [router, id, searchParams]
  )

  const updateFilter = (key: "phaseId" | "milestoneId" | "sprintId" | "sort", value: string) => {
    if (key === "phaseId") {
      pushParams({ phaseId: value, milestoneId: "", sprintId: "" })
      return
    }
    if (key === "milestoneId") {
      pushParams({ milestoneId: value, sprintId: "" })
      return
    }
    pushParams({ [key]: value } as any)
  }

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const link = document.createElement("a")
      link.href = window.URL.createObjectURL(blob)
      link.setAttribute("download", filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success("Download started")
    } catch {
      window.open(url, "_blank")
    }
  }

  React.useEffect(() => {
    ; (async () => {
      const { data, error } = await supabase.from("phases").select("id, name").eq("project_id", id)
      if (error) {
        console.error(error)
        return
      }
      setPhases(data || [])
    })()
  }, [id])

  React.useEffect(() => {
    ; (async () => {
      if (!phaseId) {
        setMilestones([])
        setSprints([])
        return
      }
      const { data, error } = await supabase.from("milestones").select("id, name").eq("phase_id", phaseId)
      if (error) {
        console.error(error)
        return
      }
      const list = data || []
      setMilestones(list)

      if (milestoneId && !list.some((m) => m.id === milestoneId)) {
        pushParams({ milestoneId: "", sprintId: "" })
      }
    })()
  }, [phaseId, milestoneId, pushParams])

  React.useEffect(() => {
    ; (async () => {
      if (!milestoneId) {
        setSprints([])
        return
      }
      const { data, error } = await supabase.from("sprints").select("id, name").eq("milestone_id", milestoneId)
      if (error) {
        console.error(error)
        return
      }
      const list = data || []
      setSprints(list)

      if (sprintId && !list.some((s) => s.id === sprintId)) {
        pushParams({ sprintId: "" })
      }
    })()
  }, [milestoneId, sprintId, pushParams])

  const fetchDocs = React.useCallback(async () => {
    setLoading(true)
    try {
      let q = supabase
        .from("documents")
        .select(`
          *,
          phases:phase_id(name),
          milestones:milestone_id(name),
          sprints:sprint_id(name)
        `)
        .eq("project_id", id)

      if (sprintId) q = q.eq("sprint_id", sprintId)
      else if (milestoneId) q = q.eq("milestone_id", milestoneId)
      else if (phaseId) q = q.eq("phase_id", phaseId)

      const { data, error } = await q.order("created_at", { ascending: sortOrder === "asc" })
      if (error) throw error
      setDocs(data || [])
    } catch (e: any) {
      console.error("Docs fetch failed:", e)
      toast.error("Failed to load documents")
    } finally {
      setLoading(false)
    }
  }, [id, phaseId, milestoneId, sprintId, sortOrder])

  React.useEffect(() => {
    fetchDocs()
  }, [fetchDocs])

  const filteredDocs = docs.filter((doc) => doc.name?.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-10 px-4 text-[#0F172A] font-sans">
     {/* Header Container */}
<div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
  
  {/* Left Side: Back + Title + Tabs */}
  <div className="flex flex-wrap items-center gap-4">
    <div className="flex items-center gap-3">
      <Link
        href={`/projects/${id}`}
        className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm group shrink-0"
      >
        <ArrowLeft className="h-5 w-5 text-[#0F172A] group-hover:text-[#006AFF]" />
      </Link>
      <h1 className="text-xl font-semibold tracking-tight whitespace-nowrap">Documents</h1>
    </div>

    {/* Tabs - Added overflow-x-auto for very small screens */}
    <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 overflow-x-auto">
      <button 
        onClick={() => { setActiveTab("all"); pushParams({ tab: "" }); }}
        className={cn("px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer", 
          activeTab === "all" ? "bg-white shadow-sm text-[#006AFF]" : "text-slate-500")}
      >
        All Docs 
      </button>
      <button 
        onClick={() => { setActiveTab("assigned"); pushParams({ tab: "assigned" }); }}
        className={cn("px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer", 
          activeTab === "assigned" ? "bg-white shadow-sm text-[#006AFF]" : "text-slate-500")}
      >
        Assigned
      </button>
    </div>
  </div>

  {/* Right Side: Actions (Search, Sort, Request) */}
  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
    {!rbacLoading && hasPermission("documents.request_sign") && (
      <div className="shrink-0">
        <RequestSignatureModal projectId={id} />
      </div>
    )}
    
    <div className="relative flex-1 md:w-64 min-w-[140px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full text-xs w-full outline-none focus:border-[#006AFF] shadow-sm"
      />
    </div>

    <button
      onClick={() => updateFilter("sort", sortOrder === "asc" ? "desc" : "asc")}
      className="h-10 px-4 bg-[#006AFF] text-white rounded-xl text-[10px] font-semibold hover:bg-[#0056D6] transition-all flex items-center gap-2 shrink-0 cursor-pointer"
    >
      <ArrowUpDown className="h-3.5 w-3.5" /> Sort
    </button>
  </div>
</div>

 <div className="bg-[#F7F8FA] p-3 md:p-4 rounded-[28px] flex flex-wrap items-center gap-3 border border-slate-200">
  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shrink-0">
    <Filter className="h-3.5 w-3.5 text-[#006AFF]" />
    <span className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider">Filters:</span>
  </div>

  {/* Make selects flex-1 on mobile so they stack or fill row */}
  <select
    onChange={(e) => updateFilter("phaseId", e.target.value)}
    className="flex-1 md:flex-none bg-white border border-slate-200 px-4 py-2 rounded-xl text-[11px] font-semibold text-[#1F2937] outline-none min-w-[120px] cursor-pointer"
    value={phaseId}
  >
    <option value="">All Phases</option>
    {phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
  </select>

  <select
    disabled={!phaseId}
    onChange={(e) => updateFilter("milestoneId", e.target.value)}
    className="flex-1 md:flex-none bg-white border border-slate-200 px-4 py-2 rounded-xl text-[11px] font-semibold text-[#1F2937] outline-none disabled:opacity-50 min-w-[120px] cursor-pointer"
    value={milestoneId}
  >
    <option value="">All Milestones</option>
    {milestones.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
  </select>

  <select
    disabled={!milestoneId}
    onChange={(e) => updateFilter("sprintId", e.target.value)}
    className="flex-1 md:flex-none bg-white border border-slate-200 px-4 py-2 rounded-xl text-[11px] font-semibold text-[#1F2937] outline-none disabled:opacity-50 min-w-[120px] cursor-pointer"
    value={sprintId}
  >
    <option value="">All Sprints</option>
    {sprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
  </select>
</div>
      {activeTab === "all" ? (
        loading ? (
          <div className="py-20 text-center text-xs text-slate-400 font-semibold uppercase tracking-widest">
            Loading documents...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredDocs.length > 0 ? (
              filteredDocs.map((doc: any) => (
                <div
                  key={doc.id}
                  className="group bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm hover:border-[#006AFF]/30 transition-all relative flex flex-col justify-between ring-1 ring-slate-50"
                >
                  <div>
                    <div className="h-14 w-14 bg-slate-100 rounded-2xl flex items-center justify-center text-[#0F172A] mb-4 group-hover:bg-[#006AFF] group-hover:text-white transition-all shadow-sm">
                      <FileText className="h-7 w-7" />
                    </div>
                    <h3 className="font-semibold text-xs text-[#1F2937] line-clamp-2 mb-1 group-hover:text-[#006AFF] transition-colors tracking-tight ">
                      {doc.name}
                    </h3>
                    <div className="flex flex-wrap gap-y-2 items-center gap-2 mb-4">
                      <span className="text-[9px] font-semibold  text-slate-600">
                        {doc.phases?.name || doc.milestones?.name || doc.sprints?.name || "Root"}
                      </span>
                      {doc.doc_type && (
                        <span className="px-2 py-0.5 text-[9px] font-semibold  text-slate-600">
                          {doc.doc_type}
                        </span>
                      )}
                      {doc.signature_status === 'signed' && (
                        <span className="px-2 py-0.5 text-[9px] font-semibold bg-green-100 text-green-700 rounded">
                          Signed
                        </span>
                      )}
                      <span className="text-[9px] font-medium text-slate-600 flex items-center gap-1 uppercase tracking-tighter">
                        <Calendar className="h-3 w-3" /> {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    {!rbacLoading && hasPermission("documents.read") && (
                      <button
                        onClick={() => handleDownload(doc.file_url, doc.name)}
                        className="w-full h-10 bg-[#006AFF] text-white rounded-xl text-[10px] font-semibold tracking-wider hover:bg-[#99C4FF] shadow-sm transition-all active:scale-95 cursor-pointer"
                      >
                        Download
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      {!rbacLoading && hasPermission("documents.read") && (
                        <button
                          onClick={() => window.open(doc.file_url, "_blank")}
                          className="h-8 bg-white border border-slate-200 text-[#1F2937] rounded-lg text-[9px] font-semibold uppercase hover:bg-[#006AFF] hover:text-white hover:border-[#006AFF] transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer shadow-sm"
                        >
                          <Eye className="h-3 w-3" /> View
                        </button>
                      )}

{!rbacLoading && hasPermission("documents.delete") && (
  <ConfirmDeleteModal
    title="Delete Document"
    description={`Are you sure you want to delete "${doc.name}"? This file will be permanently removed from the project vault.`}
    onConfirm={async () => {
      await deleteDocumentAction(doc.id, id)
      toast.success("Document deleted")
      fetchDocs()
    }}
    trigger={
      <button className="h-8 bg-white border border-slate-200 text-slate-600 rounded-lg text-[9px] font-semibold uppercase hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all active:scale-95 cursor-pointer shadow-sm w-full">
        Delete
      </button>
    }
  />
)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/20">
                <p className="text-xs text-slate-400 font-black uppercase tracking-widest opacity-60">
                  No documents found in this vault
                </p>
              </div>
            )}
          </div>
        )
      ) : (
        <AssignedDocumentsGrid 
    projectId={id} 
    searchTerm={searchTerm} 
    phaseId={phaseId}
    milestoneId={milestoneId}
    sprintId={sprintId}
    sortOrder={sortOrder}
  />
      )}

      {signingDoc && (
        <PDFSignerModal
          isOpen={!!signingDoc}
          onClose={() => setSigningDoc(null)}
          documentId={signingDoc.id}
          documentName={signingDoc.name}
          pdfUrl={signingDoc.url}
          onSignComplete={() => {
            setSigningDoc(null)
            fetchDocs()
          }}
        />
      )}
    </div>
  )
}