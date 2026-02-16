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
import { toast } from "sonner";
import { useRBAC } from "@/context/rbac-context"; 

export default function ProjectLayout({ children, params }: { children: React.ReactNode, params: any }) {
  const { id } = React.use(params) as any;
  const [project, setProject] = React.useState<any>(null);
  const [logs, setLogs] = React.useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const { hasPermission, loading } = useRBAC();

const loadData = React.useCallback(async () => {
    // 1. Fetch project details
    const { data: p } = await supabase
      .from("projects")
      .select(`*, organisations(name), project_members(users(id, name, organisations(name, is_internal)))`)
      .eq("id", id)
      .single();
    setProject(p);

    // 2. FIXED QUERY: Using explicit relationship names to resolve ambiguity
    // 'users!status_logs_changed_by_fkey' explicitly targets the 'changed_by' column
    // 'user_roles!user_roles_user_id_fkey' explicitly targets the user's roles
    const { data: l, error } = await supabase
      .from("status_logs")
      .select(`
        *,
        users!status_logs_changed_by_fkey (
          name,
          user_roles!user_roles_user_id_fkey (
            roles (
              display_name
            )
          )
        )
      `)
      .eq("target_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Audit Trail Join Failed:", error.message);
      // Fallback: simple fetch to keep the app running
      const { data: simpleLogs } = await supabase
        .from("status_logs")
        .select("*")
        .eq("target_id", id)
        .order("created_at", { ascending: false });
      setLogs(simpleLogs || []);
    } else {
      setLogs(l || []);
    }
  }, [id]);

  React.useEffect(() => { loadData(); }, [loadData]);

  if (!project) return null;
  const pmNotices = logs.filter(l => l.action_type === "PM_UPDATE");
  const members = project.project_members || [];
  const mechlinTeam = members.filter((m: any) => m.users?.organisations?.is_internal === true);
  const clientTeam = members.filter((m: any) => m.users?.organisations?.is_internal !== true);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F7F8FA] text-[#0F172A] font-sans relative">
      {!isSidebarOpen && (
        <button onClick={() => setIsSidebarOpen(true)} className="absolute top-4 right-4 z-[100] p-2 bg-[#006AFF] text-white rounded-md shadow-lg hover:bg-[#99C4FF] transition-all cursor-pointer">
          <PanelRightOpen className="h-5 w-5" />
        </button>
      )}

      <div className="flex-1 p-4 md:p-8 overflow-y-auto border-r border-slate-100 transition-all duration-300">
        {children}
      </div>

  <aside data-app-sidebar className={cn("bg-white h-screen sticky top-0 flex flex-col ...", isSidebarOpen ? "w-full md:w-[280px]" : "w-0 border-none")}>

        <section className="shrink-0 p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium uppercase text-slate-400 tracking-widest">History</h3>
            <StatusHistory logs={logs || []} /> 
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 bg-white text-slate-500 rounded-lg hover:text-[#006AFF] border border-slate-200 cursor-pointer"><PanelRightClose className="h-4 w-4" /></button>
        </section>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-slate-50 rounded-xl group">
              <span className="text-sm font-medium uppercase text-slate-400 flex items-center gap-2"><ShieldCheck className="h-3 w-3 text-[#006AFF]" /> Mechlin Team</span>
              <ChevronDown className="h-4 w-4 text-slate-300 group-data-[state=open]:rotate-180 transition-transform" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1.5 mt-2 px-1">
              {mechlinTeam.map((m: any) => (
                <div key={m.users?.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                  <div className="h-7 w-7 rounded-lg bg-[#006AFF]/10 text-[#006AFF] flex items-center justify-center text-[10px] font-semibold uppercase shrink-0 transition-colors group-hover:bg-[#006AFF] group-hover:text-white">{m.users?.name?.charAt(0)}</div>
                  <span className="text-xs font-medium text-slate-700">{m.users?.name}</span>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-slate-50 rounded-xl group">
              <span className="text-sm font-medium uppercase text-slate-400 flex items-center gap-2"><Users className="h-3 w-3 text-[#006AFF]" /> Client Team</span>
              <ChevronDown className="h-4 w-4 text-slate-300 group-data-[state=open]:rotate-180 transition-transform" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1.5 mt-2 px-1">
              {clientTeam.map((m: any) => (
                <div key={m.users?.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                  <div className="h-7 w-7 rounded-lg bg-[#006AFF]/10 text-[#006AFF] flex items-center justify-center text-[10px] font-semibold uppercase shrink-0 transition-colors group-hover:bg-[#006AFF] group-hover:text-white">{m.users?.name?.charAt(0)}</div>
                  <span className="text-xs font-medium text-slate-700">{m.users?.name}</span>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <section className="p-5 border-t border-slate-100 bg-white flex flex-col h-[45%] shrink-0">
          <div className="flex justify-between items-center mb-5 shrink-0">
            <h3 className="text-sm font-medium uppercase text-slate-400 tracking-widest flex items-center gap-2"><Megaphone className="h-3 w-3 text-[#006AFF]" /> Broadcasts</h3>
            {!loading && hasPermission('pmupdates.create') && (
              <PMUpdateDialog projectId={id} onSuccess={loadData}>
                <button className="h-7 w-7 bg-[#006AFF] text-white rounded-lg flex items-center justify-center hover:bg-[#99C4FF] transition-all shadow-md active:scale-90 cursor-pointer"><Plus className="h-4 w-4" /></button>
              </PMUpdateDialog>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {!loading && hasPermission('pmupdates.read') ? (
              pmNotices.map((log: any) => (
                <div key={log.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 relative group hover:border-[#006AFF]/30 transition-all">
                  <div className="flex gap-1.5 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-100 rounded-lg p-1 shadow-sm">
                    {!loading && hasPermission('pmupdates.update') && (
                      <PMUpdateDialog projectId={id} log={log} onSuccess={loadData}>
                        <button className="p-1.5 text-slate-400 hover:bg-[#99C4FF] cursor-pointer"><Pencil className="h-3 w-3" /></button>
                      </PMUpdateDialog>
                    )}
                    {!loading && hasPermission('pmupdates.delete') && (
                      <form action={async () => { 
                        if(confirm('Delete this broadcast?')) {
                          await deletePMUpdateAction(log.id, id); 
                          toast.success("Broadcast deleted");
                          loadData(); 
                        }
                      }}>
                        <button type="submit" className="p-1.5 text-slate-400 hover:text-red-500 cursor-pointer"><Trash2 className="h-3 w-3" /></button>
                      </form>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 line-clamp-2 font-normal" dangerouslySetInnerHTML={{ __html: log.new_value?.content }} />
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2.5">
                    <p className="text-[9px] text-slate-400 font-medium uppercase">{formatDistanceToNow(new Date(log.created_at))} ago</p>
                    <Dialog>
                      <DialogTrigger asChild><button className="text-[10px] font-semibold uppercase text-white bg-[#006AFF] hover:bg-[#99C4FF] flex items-center gap-1 cursor-pointer transition-colors px-2 py-1 rounded-md"><Eye className="h-3 w-3" /> View Full</button></DialogTrigger>
                      <DialogContent className="max-w-[95vw] md:min-w-[80vw] bg-white text-slate-900 border-none shadow-2xl p-0 overflow-hidden rounded-[32px] flex flex-col min-h-[70vh]">
                        <div className="p-6 bg-slate-50 border-b border-slate-100 shrink-0 flex items-center justify-between">
                          <DialogTitle className="font-semibold text-sm uppercase ">Project Notice</DialogTitle>
                          {/* <span className="text-[10px] font-bold text-slate-400 uppercase">
                            By: {log.users?.name || "Administrator"} ({log.users?.user_roles?.[0]?.roles?.display_name || "System"})
                          </span> */}
                        </div>
                        <div className="p-8 overflow-y-auto prose prose-slate prose-sm flex-1 font-normal" dangerouslySetInnerHTML={{ __html: log.new_value?.content }} />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))
            ) : (
              !loading && (
                <div className="h-full flex items-center justify-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest opacity-50">No updates available</p>
                </div>
              )
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}