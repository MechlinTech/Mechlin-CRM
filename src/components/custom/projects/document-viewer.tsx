"use client"

import * as React from "react"
import { FileText, Download, Trash2, Filter, Search } from "lucide-react"
import { deleteDocumentAction } from "@/actions/documents"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"

export function DocumentViewer({ docs, projectId, title, defaultFilter = "all" }: { docs: any[], projectId: string, title: string, defaultFilter?: string }) {
  const [filter, setFilter] = React.useState(defaultFilter);
  const [search, setSearch] = React.useState("");

  const filteredDocs = docs.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
    if (filter === "all") return matchesSearch;
    if (filter === "project") return matchesSearch && !d.phase_id && !d.milestone_id;
    if (filter === "phase") return matchesSearch && d.phase_id && !d.milestone_id;
    if (filter === "milestone") return matchesSearch && d.milestone_id && !d.sprint_id;
    if (filter === "sprint") return matchesSearch && d.sprint_id;
    return matchesSearch;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-6 text-black">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="font-black text-xl tracking-tighter uppercase">{title}</h2>
        <div className="flex gap-2">
            {["all", "project", "phase", "milestone", "sprint"].map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`text-[9px] font-black uppercase px-3 py-1 rounded-full transition-all ${filter === f ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-400 hover:text-black'}`}>
                    {f}
                </button>
            ))}
        </div>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
        <Input placeholder="Search documents..." className="pl-10 h-10 rounded-xl" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
        {filteredDocs.length > 0 ? filteredDocs.map((doc) => (
          <div key={doc.id} className="p-4 border rounded-2xl flex items-center justify-between hover:border-black transition-all bg-white">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-zinc-100 rounded-xl flex items-center justify-center"><FileText className="h-5 w-5" /></div>
              <div>
                <p className="font-bold text-sm">{doc.name}</p>
                <p className="text-[9px] text-zinc-400 font-bold uppercase">{new Date(doc.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <a href={doc.file_url} target="_blank" className="p-2 hover:bg-zinc-100 rounded-full"><Download className="h-4 w-4" /></a>
              <button onClick={async () => { await deleteDocumentAction(doc.id, projectId); toast.success("Removed"); }} className="p-2 text-zinc-300 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        )) : <p className="text-center py-10 text-zinc-400 text-xs font-bold uppercase">No documents found</p>}
      </div>
    </div>
  );
}