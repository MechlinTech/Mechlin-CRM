"use client"

import * as React from "react";
import { supabase } from "@/lib/supabase";
import { FileText, Download, Trash2, ArrowLeft, Calendar, Folder, ArrowUpDown, Eye, Search, Filter, X } from "lucide-react";
import Link from "next/link";
import { deleteDocumentAction } from "@/actions/documents";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function ProjectDocumentsPage({ params }: { params: any }) {
    const { id } = React.use(params) as any;
    const router = useRouter();
    const searchParams = useSearchParams();
    const phaseId = searchParams.get("phaseId");
    const milestoneId = searchParams.get("milestoneId");
    const sprintId = searchParams.get("sprintId");
    const sortOrder = searchParams.get("sort") || "desc";
    
    const [docs, setDocs] = React.useState<any[]>([]);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [phases, setPhases] = React.useState<any[]>([]);
    const [milestones, setMilestones] = React.useState<any[]>([]);
    const [sprints, setSprints] = React.useState<any[]>([]);

    const fetchData = React.useCallback(async () => {
        const { data: p } = await supabase.from("phases").select("id, name").eq("project_id", id);
        setPhases(p || []);

        if (phaseId) {
            const { data: m } = await supabase.from("milestones").select("id, name").eq("phase_id", phaseId);
            setMilestones(m || []);
        } else { setMilestones([]); setSprints([]); }

        if (milestoneId) {
            const { data: s } = await supabase.from("sprints").select("id, name").eq("milestone_id", milestoneId);
            setSprints(s || []);
        } else { setSprints([]); }

        let query = supabase.from("documents").select("*, phases(name), milestones(name), sprints(name)").eq("project_id", id);
        if (sprintId) query = query.eq("sprint_id", sprintId);
        else if (milestoneId) query = query.eq("milestone_id", milestoneId);
        else if (phaseId) query = query.eq("phase_id", phaseId);

        const { data: d } = await query.order("created_at", { ascending: sortOrder === 'asc' });
        setDocs(d || []);
    }, [id, phaseId, milestoneId, sprintId, sortOrder]);

    React.useEffect(() => { fetchData(); }, [fetchData]);

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(key, value); else params.delete(key);
        if (key === 'phaseId') { params.delete('milestoneId'); params.delete('sprintId'); }
        if (key === 'milestoneId') { params.delete('sprintId'); }
        router.push(`/projects/${id}/documents?${params.toString()}`);
    };

    const handleDownload = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click(); link.remove();
            toast.success("Download started");
        } catch (error) { window.open(url, "_blank"); }
    };

    const filteredDocs = docs.filter(doc => doc.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="max-w-7xl mx-auto space-y-6 py-10 px-4 text-slate-900 font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href={`/projects/${id}`} className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm group">
                        <ArrowLeft className="h-5 w-5 text-[#0F172A] group-hover:text-[#4F46E5]" />
                    </Link>
                    <h1 className="text-lg font-black tracking-tight uppercase italic text-[#0F172A]">Document Vault</h1>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#4F46E5] transition-colors" />
                        <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full text-xs w-full md:w-[300px] outline-none focus:border-[#4F46E5] transition-all shadow-sm" />
                    </div>
                    <button onClick={() => updateFilter('sort', sortOrder === 'asc' ? 'desc' : 'asc')} className="h-10 px-4 bg-[#0F172A] text-white rounded-md text-[10px] font-black uppercase hover:bg-[#4F46E5] transition-all shadow-sm flex items-center gap-2">
                        <ArrowUpDown className="h-3.5 w-3.5" /> Sort
                    </button>
                </div>
            </div>

            <div className="bg-slate-100 p-4 rounded-[28px] flex flex-wrap items-center gap-3 border border-slate-200">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200">
                    <Filter className="h-3.5 w-3.5 text-[#4F46E5]" />
                    <span className="text-[10px] font-black uppercase text-slate-500">Filters:</span>
                </div>
                {/* SELECTS STYLED SAME AS BUTTONS */}
                <select onChange={(e) => updateFilter('phaseId', e.target.value)} className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-[11px] font-bold text-slate-700 outline-none hover:border-[#4F46E5]" value={phaseId || ""}>
                    <option value="">All Phases</option>
                    {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select disabled={!phaseId} onChange={(e) => updateFilter('milestoneId', e.target.value)} className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-[11px] font-bold text-slate-700 outline-none disabled:opacity-50" value={milestoneId || ""}>
                    <option value="">All Milestones</option>
                    {milestones.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <select disabled={!milestoneId} onChange={(e) => updateFilter('sprintId', e.target.value)} className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-[11px] font-bold text-slate-700 outline-none disabled:opacity-50" value={sprintId || ""}>
                    <option value="">All Sprints</option>
                    {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredDocs.map((doc: any) => (
                    <div key={doc.id} className="group bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm hover:border-[#4F46E5] transition-all relative flex flex-col justify-between">
                        <div>
                            <div className="h-14 w-14 bg-slate-100 rounded-2xl flex items-center justify-center text-[#0F172A] mb-4 group-hover:bg-[#4F46E5] group-hover:text-white transition-all shadow-sm">
                                <FileText className="h-7 w-7" />
                            </div>
                            <h3 className="font-bold text-xs text-slate-800 line-clamp-2 mb-1 group-hover:text-[#4F46E5] transition-colors uppercase tracking-tight">{doc.name}</h3>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-[9px] font-black uppercase text-slate-400">{doc.phases?.name || 'Root'}</span>
                                <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 uppercase"><Calendar className="h-3 w-3" /> {new Date(doc.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="space-y-2 pt-4 border-t border-slate-100">
                            <button onClick={() => handleDownload(doc.file_url, doc.name)} className="w-full h-10 bg-[#0F172A] text-white rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-[#4F46E5] shadow-sm transition-all active:scale-95">Download</button>
                            <button onClick={async () => { if(confirm('Delete file?')) await deleteDocumentAction(doc.id, id); fetchData(); }} className="w-full h-8 bg-white border border-slate-100 text-slate-400 rounded-md text-[9px] font-black uppercase hover:text-red-500 hover:border-red-100">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}