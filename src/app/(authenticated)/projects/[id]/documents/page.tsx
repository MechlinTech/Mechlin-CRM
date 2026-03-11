"use client"

import * as React from "react"
import { supabase } from "@/lib/supabase"
import { FileText, ArrowLeft, Calendar, ArrowUpDown, Eye, Search, Filter, Loader2, X, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { deleteDocumentAction } from "@/actions/documents"
import { signAndUploadAction } from "@/actions/signDocument"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { useRBAC } from "@/context/rbac-context"
import { useAuth } from "@/hooks/useAuth"
import { motion } from "framer-motion";

// PDF.JS VIEWER
import { Viewer, Worker, SpecialZoomLevel, RenderPageProps } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface SignaturePlacement {
  pageIndex: number;
  x: number;
  y: number;
  id: string;
  scale: number;
}

interface SigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: any;
  projectId: string;
  onSuccess: () => void;
  currentUser: any;
}

function SigningModal({ isOpen, onClose, document: docRef, projectId, onSuccess, currentUser }: SigningModalProps) {
  const [signatureBase64, setSignatureBase64] = React.useState<string | null>(null);
  const [placements, setPlacements] = React.useState<SignaturePlacement[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const defaultLayoutPluginInstance = defaultLayoutPlugin({ sidebarTabs: () => [], });

  if (!isOpen || !docRef) return null;

// Custom Plugin to handle signature overlays correctly
  const signaturePlugin = () => {
    return {
      renderPageLayer: (props: any) => (
        <div
          className="absolute inset-0 z-10"
          onDoubleClick={(e) => {
            // Prevent adding a signature if you double-click an existing one
            if (e.target !== e.currentTarget) return; 
            
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            
            setPlacements([...placements, {
              id: Math.random().toString(36).substr(2, 9),
              pageIndex: props.pageIndex,
              x, y,
              scale: 1
            }]);
          }}
        >
          {placements
            .filter((p) => p.pageIndex === props.pageIndex)
            .map((p) => (
<motion.div
  key={p.id}
  drag
  dragMomentum={false}
  dragElastic={0}
  onDrag={(e, info) => {
    const pageLayer = (e.target as HTMLElement).closest('.rpv-core__page-layer');
    if (!pageLayer) return;
    
    const rect = pageLayer.getBoundingClientRect();
    
    // 1. Calculate current signature dimensions in pixels
    const sigWidthPx = 100 * (p.scale || 1);
    // Standard signature aspect ratio is approx 0.6, but we calculate relative to rect
    const sigHeightPx = sigWidthPx * 0.6; 

    // 2. Convert dimensions to percentage of the page
    const xBoundaryLimit = (sigWidthPx / 2) / rect.width;
    const yBoundaryLimit = (sigHeightPx / 2) / rect.height;

    // 3. Calculate new center position based on mouse/touch point
    let newX = (info.point.x - rect.left) / rect.width;
    let newY = (info.point.y - rect.top) / rect.height;

    // 4. STAY WITHIN BOUNDARIES: Clamp center so edges never cross 0 or 1
    newX = Math.min(Math.max(newX, xBoundaryLimit), 1 - xBoundaryLimit);
    newY = Math.min(Math.max(newY, yBoundaryLimit), 1 - yBoundaryLimit);

    setPlacements(prev => prev.map(pl => pl.id === p.id ? { ...pl, x: newX, y: newY } : pl));
  }}
  className="absolute group border-2 border-dashed border-transparent hover:border-[#006AFF] transition-colors"
  style={{
    left: `${p.x * 100}%`,
    top: `${p.y * 100}%`,
    width: `${100 * (p.scale || 1)}px`,
    transform: "translate(-50%, -50%)", // Keeps the point (x,y) as the center
    cursor: "move",
    touchAction: "none"
  }}
>
  <img src={signatureBase64!} className="w-full h-auto pointer-events-none select-none" alt="sign" />
                
                {/* DELETE BUTTON */}
                <button
                  onClick={(e) => { e.stopPropagation(); setPlacements(placements.filter(pl => pl.id !== p.id)); }}
                  className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 cursor-pointer z-[60]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                {/* RESIZE HANDLE */}
             <div 
    className="absolute -bottom-2 -right-2 w-5 h-5 bg-[#006AFF] rounded-full border-2 border-white shadow-md opacity-0 group-hover:opacity-100 cursor-se-resize hover:scale-125 transition-all z-[60]"
    onMouseDown={(e) => {
      e.stopPropagation();
      const pageLayer = (e.target as HTMLElement).closest('.rpv-core__page-layer');
      if (!pageLayer) return;
      const rect = pageLayer.getBoundingClientRect();

      const startY = e.clientY;
      const startScale = p.scale || 1;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const delta = (moveEvent.clientY - startY) / 100;
        const newScale = Math.min(Math.max(0.4, startScale + delta), 2.5);
        
        // Check boundaries even while resizing
        const newWidthPx = 100 * newScale;
        const newHeightPx = newWidthPx * 0.6;
        const xLim = (newWidthPx / 2) / rect.width;
        const yLim = (newHeightPx / 2) / rect.height;

        // If the new scale would push the edges out of the page, we don't update
        if (p.x - xLim < 0 || p.x + xLim > 1 || p.y - yLim < 0 || p.y + yLim > 1) {
            return; 
        }

        setPlacements(prev => prev.map(pl => pl.id === p.id ? { ...pl, scale: newScale } : pl));
      };
      
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }}
  />
</motion.div>
            ))}
        </div>
      ),
    };
  };
  const signaturePluginInstance = signaturePlugin();

  const handleSave = async () => {
    if (placements.length === 0) { toast.error("Place at least one signature"); return; }
    setIsProcessing(true);
    const toastId = toast.loading("Saving signed document...");
    try {
      const result = await signAndUploadAction(projectId, docRef.id, signatureBase64!, placements, currentUser?.id, currentUser?.user_metadata?.name || "User");
      if (result.success) {
        toast.success("Document signed!", { id: toastId });
        setPlacements([]); onSuccess(); onClose();
      } else { toast.error(result.error, { id: toastId }); }
    } catch (err) { toast.error("An error occurred", { id: toastId }); } 
    finally { setIsProcessing(false); }
  };

  return (
<div className="fixed inset-0 bg-slate-900/90 z-[999] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] w-full max-w-6xl h-[95vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A]">Sign & Place</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Double-click page to add signature</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setPlacements([])} className="px-4 py-2 text-xs font-bold text-slate-500 border rounded-xl hover:bg-slate-50 cursor-pointer">Clear</button>
            <button 
              onClick={handleSave} 
              disabled={isProcessing || !signatureBase64 || placements.length === 0} 
              className="px-6 py-2 bg-[#006AFF] text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isProcessing && <Loader2 className="h-3 w-3 animate-spin" />}
              Save ({placements.length})
            </button>
            <button 
              onClick={onClose} 
              className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-b flex items-center gap-4">
          <label className="flex items-center gap-2 px-6 py-3 bg-[#006AFF] text-white rounded-2xl text-[11px] font-bold cursor-pointer hover:bg-blue-700 transition-all">
            <FileText className="h-4 w-4" /> {signatureBase64 ? "Change Image" : "Upload Signature Image"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0]; if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setSignatureBase64(reader.result as string);
                reader.readAsDataURL(file);
              }
            }} />
          </label>
        </div>

        <div className="flex-1 bg-slate-100 overflow-hidden relative">
          <div className="h-full w-full">
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/legacy/build/pdf.worker.min.js">
              <Viewer 
                fileUrl={docRef.file_url} 
                plugins={[defaultLayoutPluginInstance, signaturePluginInstance]} 
                defaultScale={SpecialZoomLevel.PageWidth}
              />
            </Worker>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDocumentsPage({ params }: { params: any }) {
  const { id } = React.use(params) as any
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { hasPermission, loading: rbacLoading } = useRBAC()

  const phaseId = searchParams.get("phaseId") || ""
  const milestoneId = searchParams.get("milestoneId") || ""
  const sprintId = searchParams.get("sprintId") || ""
  const sortOrder = searchParams.get("sort") || "desc"

  const [docs, setDocs] = React.useState<any[]>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [phases, setPhases] = React.useState<any[]>([])
  const [milestones, setMilestones] = React.useState<any[]>([])
  const [sprints, setSprints] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)

  const [isSigningModalOpen, setIsSigningModalOpen] = React.useState(false);
  const [selectedDocForSigning, setSelectedDocForSigning] = React.useState<any>(null);

  const pushParams = React.useCallback(
    (next: Record<string, string>) => {
      const p = new URLSearchParams(searchParams.toString())
      Object.entries(next).forEach(([k, v]) => { if (!v) p.delete(k); else p.set(k, v); })
      router.push(`/projects/${id}/documents?${p.toString()}`)
    }, [router, id, searchParams]
  )

  const updateFilter = (key: "phaseId" | "milestoneId" | "sprintId" | "sort", value: string) => {
    if (key === "phaseId") { pushParams({ phaseId: value, milestoneId: "", sprintId: "" }); return; }
    if (key === "milestoneId") { pushParams({ milestoneId: value, sprintId: "" }); return; }
    pushParams({ [key]: value } as any)
  }

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url); const blob = await response.blob()
      const link = document.createElement("a"); link.href = window.URL.createObjectURL(blob)
      link.setAttribute("download", filename); document.body.appendChild(link); link.click(); link.remove();
      toast.success("Download started")
    } catch { window.open(url, "_blank") }
  }

  // Load Filters
  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.from("phases").select("id, name").eq("project_id", id)
      if (data) setPhases(data)
    })()
  }, [id])

  React.useEffect(() => {
    (async () => {
      if (!phaseId) { setMilestones([]); setSprints([]); return; }
      const { data } = await supabase.from("milestones").select("id, name").eq("phase_id", phaseId)
      if (data) setMilestones(data)
    })()
  }, [phaseId])

  React.useEffect(() => {
    (async () => {
      if (!milestoneId) { setSprints([]); return; }
      const { data } = await supabase.from("sprints").select("id, name").eq("milestone_id", milestoneId)
      if (data) setSprints(data)
    })()
  }, [milestoneId])

  const fetchDocs = React.useCallback(async () => {
    setLoading(true)
    try {
      let q = supabase.from("documents").select(`*, phases:phase_id(name), milestones:milestone_id(name), sprints:sprint_id(name)`).eq("project_id", id)
      if (sprintId) q = q.eq("sprint_id", sprintId)
      else if (milestoneId) q = q.eq("milestone_id", milestoneId)
      else if (phaseId) q = q.eq("phase_id", phaseId)
      const { data, error } = await q.order("created_at", { ascending: sortOrder === "asc" })
      if (!error) setDocs(data || [])
    } finally { setLoading(false) }
  }, [id, phaseId, milestoneId, sprintId, sortOrder])

  React.useEffect(() => { fetchDocs() }, [fetchDocs])

  const filteredDocs = docs.filter((doc) => doc.name?.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-10 px-4 text-[#0F172A] font-sans">
      <SigningModal isOpen={isSigningModalOpen} onClose={() => setIsSigningModalOpen(false)} document={selectedDocForSigning} projectId={id} onSuccess={fetchDocs} currentUser={user} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${id}`} className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm group cursor-pointer">
            <ArrowLeft className="h-5 w-5 text-[#0F172A] group-hover:text-[#006AFF]" />
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">Documents</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group flex-1 md:w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#006AFF] transition-colors" />
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full text-xs w-full outline-none focus:border-[#006AFF] transition-all shadow-sm font-medium" />
          </div>
          <button onClick={() => updateFilter("sort", sortOrder === "asc" ? "desc" : "asc")} className="h-10 px-4 bg-[#006AFF] text-white rounded-xl text-[10px] font-semibold hover:bg-[#99C4FF] transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95">
            <ArrowUpDown className="h-3.5 w-3.5" /> Sort
          </button>
        </div>
      </div>

      <div className="bg-[#F7F8FA] p-4 rounded-[28px] flex flex-wrap items-center gap-3 border border-slate-200">
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200">
          <Filter className="h-3.5 w-3.5 text-[#006AFF]" />
          <span className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider">Filters:</span>
        </div>
        <select onChange={(e) => updateFilter("phaseId", e.target.value)} className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-[11px] font-semibold text-[#1F2937] outline-none hover:border-[#006AFF] cursor-pointer" value={phaseId}><option value="">All Phases</option>{phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select disabled={!phaseId} onChange={(e) => updateFilter("milestoneId", e.target.value)} className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-[11px] font-semibold text-[#1F2937] outline-none disabled:opacity-50 cursor-pointer" value={milestoneId}><option value="">All Milestones</option>{milestones.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
        <select disabled={!milestoneId} onChange={(e) => updateFilter("sprintId", e.target.value)} className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-[11px] font-semibold text-[#1F2937] outline-none disabled:opacity-50 cursor-pointer" value={sprintId}><option value="">All Sprints</option>{sprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 font-semibold uppercase tracking-widest">Loading documents...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredDocs.length > 0 ? (
            filteredDocs.map((doc: any) => (
              <div key={doc.id} className="group bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm hover:border-[#006AFF]/30 transition-all relative flex flex-col justify-between ring-1 ring-slate-50">
                <div>
                  <div className="h-14 w-14 bg-slate-100 rounded-2xl flex items-center justify-center text-[#0F172A] mb-4 group-hover:bg-[#006AFF] group-hover:text-white transition-all shadow-sm"><FileText className="h-7 w-7" /></div>
                  <h3 className="font-semibold text-xs text-[#1F2937] line-clamp-2 mb-1 group-hover:text-[#006AFF] transition-colors tracking-tight ">{doc.name}</h3>
                  <div className="flex flex-wrap gap-y-2 items-center gap-2 mb-4">
                    <span className="text-[9px] font-semibold text-slate-600">{doc.phases?.name || doc.milestones?.name || doc.sprints?.name || "Root"}</span>
                    {doc.doc_type && <span className="px-2 py-0.5 text-[9px] font-semibold text-slate-600">{doc.doc_type}</span>}
                    <span className="text-[9px] font-medium text-slate-600 flex items-center gap-1 uppercase tracking-tighter"><Calendar className="h-3 w-3" /> {new Date(doc.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100">
                  {!rbacLoading && hasPermission("documents.sign") && (
                    <button onClick={() => { setSelectedDocForSigning(doc); setIsSigningModalOpen(true); }} className="w-full h-10 bg-white border-2 border-[#006AFF] text-[#006AFF] rounded-xl text-[10px] font-bold uppercase hover:bg-[#006AFF] hover:text-white shadow-sm transition-all active:scale-95 cursor-pointer mb-2">Sign</button>
                  )}
                  {!rbacLoading && hasPermission("documents.read") && (
                    <button onClick={() => handleDownload(doc.file_url, doc.name)} className="w-full h-10 bg-[#006AFF] text-white rounded-xl text-[10px] font-semibold tracking-wider hover:bg-[#99C4FF] shadow-sm transition-all active:scale-95 cursor-pointer">Download</button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {!rbacLoading && hasPermission("documents.read") && (
                      <button onClick={() => window.open(doc.file_url, "_blank")} className="h-8 bg-white border border-slate-200 text-[#1F2937] rounded-lg text-[9px] font-semibold uppercase hover:bg-[#006AFF] hover:text-white hover:border-[#006AFF] transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer shadow-sm"><Eye className="h-3 w-3" /> View</button>
                    )}
                    {!rbacLoading && hasPermission("documents.delete") && (
                      <button onClick={async () => { if (confirm("Delete file?")) { await deleteDocumentAction(doc.id, id); fetchDocs(); } }} className="h-8 bg-white border border-slate-200 text-slate-600 rounded-lg text-[9px] font-semibold uppercase hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all active:scale-95 cursor-pointer shadow-sm">Delete</button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/20"><p className="text-xs text-slate-400 font-black uppercase tracking-widest opacity-60">No documents found in this vault</p></div>
          )}
        </div>
      )}
    </div>
  )
}