import { supabase } from "@/lib/supabase";
import { FileText, Download, Trash2, ArrowLeft, Search, Calendar, Folder, ArrowUpDown, Filter } from "lucide-react";
import Link from "next/link";
import { deleteDocumentAction } from "@/actions/documents";

export default async function ProjectDocumentsPage({ params, searchParams }: any) {
    const { id } = await params;
    const sp = await searchParams;
    
    // State from URL
    const typeFilter = sp?.type || 'all';
    const sortOrder = sp?.sort === 'asc' ? 'asc' : 'desc';
    const queryTerm = sp?.q || '';

    let query = supabase
        .from("documents")
        .select("*, phases(name), milestones(name), sprints(name)")
        .eq("project_id", id);

    // Apply Hierarchy Logic
    if (sp?.sprintId) query = query.eq("sprint_id", sp.sprintId);
    else if (sp?.milestoneId) query = query.eq("milestone_id", sp.milestoneId);
    else if (sp?.phaseId) query = query.eq("phase_id", sp.phaseId);

    // Apply Type Filter
    if (typeFilter === 'project') query = query.is('phase_id', null).is('milestone_id', null);
    if (typeFilter === 'phase') query = query.not('phase_id', 'is', null).is('milestone_id', null);
    if (typeFilter === 'milestone') query = query.not('milestone_id', 'is', null).is('sprint_id', null);
    if (typeFilter === 'sprint') query = query.not('sprint_id', 'is', null);

    const { data: docs } = await query.order("created_at", { ascending: sortOrder === 'asc' });

    // Client-side search simulation for demo
    const filteredDocs = docs?.filter(d => d.name.toLowerCase().includes(queryTerm.toLowerCase())) || [];

    return (
        <div className="max-w-6xl mx-auto space-y-8 py-10 text-black font-sans">
            <header className="flex flex-col gap-6 bg-zinc-50 p-10 rounded-[48px] border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href={`/projects/${id}`} className="h-12 w-12 rounded-full bg-white border border-zinc-200 flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-md">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase">Document Vault</h1>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Global Repository</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link 
                            href={`/projects/${id}/documents?sort=${sortOrder === 'asc' ? 'desc' : 'asc'}`}
                            className="flex items-center gap-2 px-6 py-2 bg-white border border-zinc-200 rounded-full text-[10px] font-black uppercase hover:border-black transition-all shadow-sm"
                        >
                            <ArrowUpDown className="h-3 w-3" /> Sort: {sortOrder === 'asc' ? 'Oldest' : 'Newest'}
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-200">
                    <div className="flex flex-wrap gap-2">
                        {['all', 'project', 'phase', 'milestone', 'sprint'].map((t) => (
                            <Link 
                                key={t}
                                href={`/projects/${id}/documents?type=${t}`}
                                className={`px-5 py-2 rounded-full text-[9px] font-black uppercase transition-all shadow-sm ${
                                    typeFilter === t ? 'bg-black text-white' : 'bg-white border text-zinc-400 hover:text-black'
                                }`}
                            >
                                {t}
                            </Link>
                        ))}
                    </div>
                    <form className="relative">
                        <Search className="absolute left-4 top-2.5 h-4 w-4 text-zinc-400" />
                        <input 
                            name="q"
                            placeholder="Search by file name..." 
                            className="w-full pl-12 pr-4 py-2 bg-white border border-zinc-200 rounded-full text-sm focus:outline-none focus:border-black shadow-inner"
                        />
                    </form>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4 px-2">
                {filteredDocs.length > 0 ? filteredDocs.map((doc: any) => (
                    <div key={doc.id} className="p-6 bg-white border border-zinc-100 rounded-[32px] flex items-center justify-between hover:border-black transition-all group shadow-sm">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100 group-hover:bg-zinc-100 transition-colors">
                                <FileText className="h-8 w-8 text-zinc-900" />
                            </div>
                            <div>
                                <p className="font-black text-xl tracking-tight mb-1">{doc.name}</p>
                                <div className="flex gap-4 items-center">
                                    <span className="text-[9px] font-bold text-zinc-400 uppercase flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {new Date(doc.created_at).toLocaleDateString()}</span>
                                    <span className="text-[9px] font-black uppercase bg-zinc-900 text-white px-2 py-0.5 rounded flex items-center gap-1.5 shadow-sm">
                                        <Folder className="h-3 w-3" /> {doc.sprints?.name || doc.milestones?.name || doc.phases?.name || 'Project Root'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <a href={doc.file_url} target="_blank" className="h-12 px-8 bg-black text-white rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-tighter hover:bg-zinc-800 transition-all shadow-lg">
                                <Download className="h-4 w-4" /> Download
                            </a>
                            <form action={async () => { "use server"; await deleteDocumentAction(doc.id, id); }}>
                                <button type="submit" className="h-12 w-12 flex items-center justify-center rounded-2xl border border-zinc-100 text-zinc-300 hover:text-red-600 hover:bg-red-50 transition-all shadow-sm">
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </form>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-40 border-2 border-dashed border-zinc-100 rounded-[48px] bg-zinc-50/20">
                        <p className="text-zinc-400 font-black uppercase text-sm tracking-widest">Vault is empty for this criteria</p>
                    </div>
                )}
            </div>
        </div>
    );
}