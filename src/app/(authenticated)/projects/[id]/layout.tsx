"use client"

import { supabase } from "@/lib/supabase";
import { PMUpdateDialog } from "@/components/custom/projects/pm-updates";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Megaphone, Eye, Users, ChevronRight, PanelRightClose, PanelRightOpen, ShieldCheck, ChevronDown } from "lucide-react";
import { deletePMUpdateAction } from "@/actions/pm-updates";
import { formatDistanceToNow } from "date-fns";
import React from "react";
import { StatusHistory } from "@/components/custom/projects/status-history";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export default function ProjectLayout({ children, params }: { children: React.ReactNode, params: any }) {
  const { id } = React.use(params) as any;
  const [project, setProject] = React.useState<any>(null);
  const [logs, setLogs] = React.useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      const { data: p } = await supabase.from("projects").select(`*, organisations(name), project_members(users(id, name, organisations(name, is_internal)))`).eq("id", id).single();
      const { data: l } = await supabase.from("status_logs").select("*, users(name)").eq("target_id", id).order("created_at", { ascending: false });
      setProject(p);
      setLogs(l || []);
    }
    loadData();
  }, [id]);

  if (!project) return null;
  const pmNotices = logs.filter(l => l.action_type === "PM_UPDATE");
  const members = project.project_members || [];
  const mechlinTeam = members.filter((m: any) => m.users?.organisations?.is_internal === true);
  const clientTeam = members.filter((m: any) => m.users?.organisations?.is_internal !== true);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans relative">
      {!isSidebarOpen && (
        <button onClick={() => setIsSidebarOpen(true)} className="absolute top-6 right-4 z-[100] p-2 bg-[#0F172A] text-white rounded-md shadow-lg hover:bg-[#4F46E5] transition-all cursor-pointer active:scale-95 border border-[#0F172A]">
          <PanelRightOpen className="h-5 w-5" />
        </button>
      )}

      <div className="flex-1 p-8 overflow-y-auto border-r border-slate-100 transition-all duration-300">{children}</div>

      <aside className={cn("bg-white h-screen sticky top-0 flex flex-col border-l border-slate-200 shadow-sm transition-all duration-300 overflow-hidden shrink-0", isSidebarOpen ? "w-[340px]" : "w-0 border-none")}>
        <section className="shrink-0 p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest">History</h3>
            <StatusHistory logs={logs || []} />
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 bg-white text-[#0F172A] rounded-lg hover:text-[#4F46E5] transition-all border border-slate-200 cursor-pointer"><PanelRightClose className="h-4 w-4" /></button>
        </section>

        {/* DROPDOWN TEAMS (Replaced Scrollbars) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-slate-50 rounded-xl group">
              <span className="text-sm font-black uppercase text-slate-400 flex items-center gap-2"><ShieldCheck className="h-3 w-3 text-[#4F46E5]" /> Mechlin</span>
              <ChevronDown className="h-4 w-4 text-slate-300 group-data-[state=open]:rotate-180 transition-transform" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1.5 mt-2 px-1">
              {mechlinTeam.map((m: any) => (
                <div key={m.users?.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <div className="h-7 w-7 rounded-lg bg-[#0F172A] text-white flex items-center justify-center text-[10px] font-bold uppercase shrink-0">{m.users?.name?.charAt(0)}</div>
                  <span className="text-xs font-bold text-slate-700">{m.users?.name}</span>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-slate-50 rounded-xl group">
              <span className="text-sm font-black uppercase text-slate-400 flex items-center gap-2"><Users className="h-3 w-3" /> Client Team</span>
              <ChevronDown className="h-4 w-4 text-slate-300 group-data-[state=open]:rotate-180 transition-transform" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1.5 mt-2 px-1">
              {clientTeam.map((m: any) => (
                <div key={m.users?.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <div className="h-7 w-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold uppercase shrink-0">{m.users?.name?.charAt(0)}</div>
                  <span className="text-xs font-bold text-slate-600">{m.users?.name}</span>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* BROADCAST SECTION (White Mode Redesign) */}
        <section className="p-5 border-t border-slate-100 bg-white flex flex-col h-[45%] shrink-0">
          <div className="flex justify-between items-center mb-5 shrink-0">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Megaphone className="h-3 w-3 text-[#4F46E5]" /> Broadcasts</h3>
            <PMUpdateDialog projectId={id}>
              <button className="h-7 w-7 bg-[#0F172A] text-white rounded-lg flex items-center justify-center hover:bg-[#4F46E5] transition-all shadow-md active:scale-90 cursor-pointer"><Plus className="h-4 w-4" /></button>
            </PMUpdateDialog>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {pmNotices.map((log: any) => (
              <div key={log.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 relative group hover:border-[#4F46E5]/50 transition-all">
                <div className="flex gap-1.5 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-100 rounded-lg p-1 shadow-sm">
                  <PMUpdateDialog projectId={id} log={log}><button className="p-1.5 text-slate-400 hover:text-[#4F46E5] cursor-pointer"><Pencil className="h-3 w-3" /></button></PMUpdateDialog>
                  <form action={async () => { deletePMUpdateAction(log.id, id); }}><button type="submit" className="p-1.5 text-slate-400 hover:text-red-500 cursor-pointer"><Trash2 className="h-3 w-3" /></button></form>
                </div>
                <div className="text-xs text-slate-600 line-clamp-2 leading-relaxed prose prose-slate prose-xs" dangerouslySetInnerHTML={{ __html: log.new_value?.content }} />
                <div className="flex items-center justify-between border-t border-slate-200 pt-2.5">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{formatDistanceToNow(new Date(log.created_at))} ago</p>
                  <Dialog>
                    <DialogTrigger asChild><button className="text-[10px] font-black uppercase text-[#0F172A] hover:text-[#4F46E5] flex items-center gap-1 cursor-pointer transition-colors"><Eye className="h-3 w-3" /> View Full</button></DialogTrigger>
                    <DialogContent className="max-w-xl bg-white text-slate-900 border-none shadow-2xl p-0 overflow-hidden rounded-[32px]">
                      <div className="p-6 bg-slate-50 border-b border-slate-100 font-bold text-lg uppercase italic">Project Notice</div>
                      <div className="p-10 max-h-[60vh] overflow-y-auto prose prose-slate text-xs" dangerouslySetInnerHTML={{ __html: log.new_value?.content }} />
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