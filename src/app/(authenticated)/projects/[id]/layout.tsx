import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import React from "react";

export default async function ProjectLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode, 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  
  // 1. Fetch Project and Members (Removed activity_logs from here to avoid PGRST200 relationship error)
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
    console.error("Project Fetch Error:", JSON.stringify(projectError, null, 2));
    notFound();
  }

  // 2. Fetch Status Logs (Fixed: Changed table name from activity_logs to status_logs per your DB hint)
  const { data: logs, error: logsError } = await supabase
    .from("status_logs")
    .select("*")
    .eq("target_id", id)
    .eq("target_type", "project")
    .order("created_at", { ascending: false })
    .limit(5);

  if (logsError) {
    console.error("Logs Fetch Error (Table might be status_logs):", JSON.stringify(logsError, null, 2));
  }

  const members = project.project_members || [];
  const mechlinTeam = members.filter((m: any) => m.users?.organisations?.is_internal);
  const orgTeam = members.filter((m: any) => !m.users?.organisations?.is_internal);

  return (
    <div className="flex min-h-screen bg-white text-black">
      <div className="flex-1 p-8 overflow-y-auto border-r border-zinc-100">
        {children}
      </div>

      <aside className="w-80 p-6 space-y-10 bg-zinc-50/50 h-screen sticky top-0 overflow-y-auto shadow-inner border-l border-zinc-100">
        <section className="space-y-6">
          <div>
            <h3 className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mb-4">Mechlin Team</h3>
            <div className="space-y-3">
              {mechlinTeam.length > 0 ? mechlinTeam.map((m: any) => (
                <div key={m.users.id} className="flex items-center gap-3 group">
                  <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shadow-sm group-hover:scale-105 transition-transform">
                    {m.users.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium">{m.users.name}</span>
                </div>
              )) : <p className="text-[10px] text-zinc-400 italic">No internal members assigned.</p>}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mb-4 border-t pt-4">
              Client Team ({project.organisations?.name || 'Unknown'})
            </h3>
            <div className="space-y-3">
              {orgTeam.length > 0 ? orgTeam.map((m: any) => (
                <div key={m.users.id} className="flex items-center gap-3 group">
                  <div className="h-8 w-8 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center text-xs font-bold shadow-sm group-hover:scale-105 transition-transform">
                    {m.users.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium">{m.users.name}</span>
                </div>
              )) : <p className="text-[10px] text-zinc-400 italic">No client members assigned.</p>}
            </div>
          </div>
        </section>

        <section className="pt-10 border-t border-zinc-200">
          <h3 className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mb-6 text-zinc-900">Recent PM Updates</h3>
          <div className="space-y-6">
            {logs && logs.length > 0 ? logs.map((log: any) => (
              <div key={log.id} className="text-xs border-l-2 border-zinc-900 pl-4 py-1">
                <p className="font-semibold text-zinc-800 uppercase tracking-tighter mb-1">
                   Status: {log.new_data?.status || 'Update'}
                </p>
                <p className="text-zinc-400">
                  {formatDistanceToNow(new Date(log.created_at))} ago
                </p>
              </div>
            )) : <p className="text-[10px] text-zinc-400 italic">No recent status updates found.</p>}
          </div>
        </section>
      </aside>
    </div>
  );
}