import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { PMUpdateDialog } from "@/components/custom/projects/pm-updates";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Megaphone, Eye } from "lucide-react";
import { deletePMUpdateAction } from "@/actions/pm-updates";
import { formatDistanceToNow } from "date-fns";
import React from "react";
import { StatusHistory } from "@/components/custom/projects/status-history";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default async function ProjectLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode, 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(`*, organisations(name), project_members(users(id, name, organisations(name, is_internal)))`)
    .eq("id", id)
    .single();

  if (!project || projectError) notFound();

  const { data: logs } = await supabase
    .from("status_logs")
    .select("*, users(name)") // Joined table for user attribution
    .eq("target_id", id)
    .order("created_at", { ascending: false });

  const pmNotices = (logs || []).filter(l => l.action_type === "PM_UPDATE");
  const members = project.project_members || [];
  const mechlinTeam = members.filter((m: any) => m.users?.organisations?.is_internal === true);
  const orgTeam = members.filter((m: any) => m.users?.organisations?.is_internal !== true);

  return (
    <div className="flex min-h-screen bg-white text-black font-sans">
      <div className="flex-1 p-8 overflow-y-auto border-r border-zinc-100">
        {children}
      </div>

      <aside className="w-80 p-6 space-y-10 bg-zinc-50/50 h-screen sticky top-0 overflow-y-auto border-l border-zinc-100 shadow-sm font-sans">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Project Health</h3>
            <StatusHistory logs={logs || []} />
          </div>
          <Badge className="px-4 py-1 font-bold rounded-full border-none bg-green-100 text-green-700 uppercase text-[10px]">
            {project.status || 'Active'}
          </Badge>
        </section>

        <section className="space-y-6">
          <div>
            <h3 className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mb-4">Mechlin Team</h3>
            <div className="space-y-3">
              {mechlinTeam.map((m: any) => (
                <div key={m.users?.id} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold ring-2 ring-white uppercase">{m.users?.name?.charAt(0)}</div>
                  <span className="text-sm font-medium">{m.users?.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mb-4 font-black">Client Team ({project.organisations?.name})</h3>
            <div className="space-y-3">
              {orgTeam.map((m: any) => (
                <div key={m.users?.id} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center text-xs font-bold ring-2 ring-white uppercase">{m.users?.name?.charAt(0)}</div>
                  <span className="text-sm font-medium">{m.users?.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pt-8 border-t border-zinc-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
              <Megaphone className="h-3 w-3" /> PM Notice Board
            </h3>
            <PMUpdateDialog projectId={id}>
               <button type="button" className="p-1.5 bg-black text-white rounded-full hover:bg-zinc-800 shadow-sm transition-all"><Plus className="h-3 w-3" /></button>
            </PMUpdateDialog>
          </div>
          <div className="space-y-4 font-sans">
            {pmNotices.map((log: any) => (
              <div key={log.id} className="p-5 bg-zinc-900 text-white border border-zinc-800 rounded-3xl space-y-3 relative group shadow-xl">
                <div className="flex gap-2 absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800/80 backdrop-blur-sm rounded-lg p-1">
                  <PMUpdateDialog projectId={id} log={log}><button type="button" className="p-1 hover:text-blue-400"><Pencil className="h-3 w-3" /></button></PMUpdateDialog>
                  <form action={async () => { "use server"; await deletePMUpdateAction(log.id, id); }}><button type="submit" className="p-1 hover:text-red-400"><Trash2 className="h-3 w-3" /></button></form>
                </div>
                <div className="text-xs text-zinc-200 line-clamp-3 overflow-hidden prose prose-invert prose-xs" dangerouslySetInnerHTML={{ __html: log.new_value?.content }} />
                <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                  <p className="text-[9px] text-zinc-500 font-medium uppercase" suppressHydrationWarning>{formatDistanceToNow(new Date(log.created_at))} ago</p>
                  <Dialog>
                    <DialogTrigger asChild><button className="flex items-center gap-1 text-[9px] font-black uppercase text-white hover:text-zinc-300"><Eye className="h-3 w-3" /> View Full</button></DialogTrigger>
                    <DialogContent className="max-w-xl bg-white text-black border-none shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                      <DialogHeader className="p-6 border-b"><DialogTitle className="text-xl font-black uppercase text-zinc-900">Project Notice</DialogTitle></DialogHeader>
                      <div className="p-8 overflow-y-auto prose prose-sm max-w-none prose-p:leading-relaxed" dangerouslySetInnerHTML={{ __html: log.new_value?.content }} />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}