import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { PMUpdateDialog } from "@/components/custom/projects/pm-updates";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Megaphone } from "lucide-react";
import { deletePMUpdateAction } from "@/actions/pm-updates";
import { formatDistanceToNow } from "date-fns";
import React from "react";

export default async function ProjectLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode, 
  params: Promise<{ id: string }> 
}) {
  // Await params to ensure ID is available for Supabase
  const { id } = await params;

  // 1. Fetch Project and Members [cite: 4, 111]
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(`
      *,
      organisations(name),
      project_members(
        users(id, name, organisations(name, is_internal))
      )
    `)
    .eq("id", id)
    .single();

  if (!project || projectError) {
    console.error("Project Fetch Error:", projectError);
    notFound();
  }

  // 2. FIX: Fetch PM Updates from 'status_logs' instead of 'activity_logs'
  const { data: logs, error: logsError } = await supabase
    .from("status_logs")
    .select("*")
    .eq("target_id", id)
    .eq("action_type", "PM_UPDATE")
    .order("created_at", { ascending: false });

  if (logsError) {
    console.error("Status Logs Fetch Error:", JSON.stringify(logsError));
  }

  const members = project.project_members || [];
  const mechlinTeam = members.filter((m: any) => m.users?.organisations?.is_internal === true);
  const orgTeam = members.filter((m: any) => m.users?.organisations?.is_internal !== true);

  return (
    <div className="flex min-h-screen bg-white text-black font-sans">
      {/* Main Content Area [cite: 6, 116] */}
      <div className="flex-1 p-8 overflow-y-auto border-r border-zinc-100">
        {children}
      </div>

      {/* Persistent Sidebar [cite: 3, 84] */}
      <aside className="w-80 p-6 space-y-10 bg-zinc-50/50 h-screen sticky top-0 overflow-y-auto border-l border-zinc-100 shadow-sm font-sans">
        {/* Project Health Status [cite: 25, 154] */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Project Health</h3>
          <Badge className={`px-4 py-1 font-bold rounded-full border-none shadow-sm ${
            project.status === 'Active' ? 'bg-green-100 text-green-700' : 
            project.status === 'Suspended' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {project.status || 'Pending'}
          </Badge>
        </section>

        {/* Team Members Section [cite: 4, 12, 108] */}
        <section className="space-y-6">
          <div>
            <h3 className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mb-4">Mechlin Team</h3>
            <div className="space-y-3">
              {mechlinTeam.length > 0 ? mechlinTeam.map((m: any) => (
                <div key={m.users?.id} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold ring-2 ring-white shadow-sm">
                    {m.users?.name?.charAt(0)}
                  </div>
                  <span className="text-sm font-medium">{m.users?.name}</span>
                </div>
              )) : <p className="text-[10px] text-zinc-400 italic">No internal members assigned.</p>}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mb-4 font-black text-zinc-900">
                Client Team ({project.organisations?.name || "Partner"})
            </h3>
            <div className="space-y-3">
              {orgTeam.length > 0 ? orgTeam.map((m: any) => (
                <div key={m.users?.id} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center text-xs font-bold ring-2 ring-white shadow-sm">
                    {m.users?.name?.charAt(0)}
                  </div>
                  <span className="text-sm font-medium">{m.users?.name}</span>
                </div>
              )) : <p className="text-[10px] text-zinc-400 italic">No client members assigned.</p>}
            </div>
          </div>
        </section>

        {/* PM Notice Board (Status History & Updates) [cite: 8, 25, 118] */}
        <section className="pt-8 border-t border-zinc-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
              <Megaphone className="h-3 w-3" /> PM Notice Board
            </h3>
            <PMUpdateDialog projectId={id}>
               <button className="p-1.5 bg-black text-white rounded-full hover:bg-zinc-800 transition-colors shadow-sm">
                 <Plus className="h-3 w-3" />
               </button>
            </PMUpdateDialog>
          </div>
          <div className="space-y-4">
            {logs && logs.length > 0 ? logs.map((log: any) => (
              <div key={log.id} className="p-4 bg-white border border-zinc-200 rounded-2xl space-y-3 relative group shadow-sm hover:border-zinc-400 transition-all">
                <div className="flex gap-2 absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded-lg shadow-sm">
                  <PMUpdateDialog projectId={id} log={log}>
                    <button className="p-1 text-zinc-400 hover:text-black transition-colors">
                      <Pencil className="h-3 w-3" />
                    </button>
                  </PMUpdateDialog>
                  <form action={async () => { "use server"; await deletePMUpdateAction(log.id, id); }}>
                    <button type="submit" className="p-1 text-zinc-400 hover:text-red-600 transition-colors">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </form>
                </div>
                <div 
                  className="text-xs text-zinc-600 leading-relaxed prose prose-zinc max-w-none prose-p:my-0" 
                  dangerouslySetInnerHTML={{ __html: log.new_data?.content || log.content }} 
                />
                <p className="text-[9px] text-zinc-400 border-t pt-2 font-medium">
                  {formatDistanceToNow(new Date(log.created_at))} ago
                </p>
              </div>
            )) : <p className="text-[10px] text-zinc-400 italic text-center py-4 font-medium">No project notices posted.</p>}
          </div>
        </section>
      </aside>
    </div>
  );
}