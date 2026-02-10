"use client"

import { supabase } from "@/lib/supabase";
import { 
  ChevronRight, Plus, Pencil, Settings2, Trash2, FolderOpen, 
  FileUp, Activity, Github, ReceiptText 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PhaseForm } from "@/components/custom/projects/phase-form";
import { MilestoneForm } from "@/components/custom/projects/milestone-form";
import { CreateProjectForm } from "@/components/custom/projects/create-project-form";
import { InvoiceForm } from "@/components/custom/projects/invoice-form";
import { InvoiceList } from "@/components/custom/projects/invoice-list";
import { deletePhaseAction } from "@/actions/hierarchy";
import { ActionButton } from "@/components/shared/action-button";
import { DocumentForm } from "@/components/custom/projects/document-form";
import Link from "next/link";
import React from "react";
import { ProjectWiki } from "@/components/custom/wiki";
import { ProjectThreads } from "@/components/custom/threads";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ProjectOverview({ params }: { params: any }) {
  const { id } = React.use(params) as any;
  const [project, setProject] = React.useState<any>(null);
  const [organisations, setOrganisations] = React.useState<any[]>([]);
  
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isAddPhaseOpen, setIsAddPhaseOpen] = React.useState(false);
  const [activeMilestonePhase, setActiveMilestonePhase] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    // FIX: Added 'user_id' to the project_members selection so the edit form can see existing members
    const { data: p } = await supabase
      .from("projects")
      .select("*, organisations(*), phases(*, milestones(*)), invoices(*), project_members(user_id, users(id, name))")
      .eq("id", id)
      .single();
      
    const { data: o } = await supabase.from("organisations").select("*");
    setProject(p);
    setOrganisations(o || []);
  }, [id]);

  React.useEffect(() => { loadData(); }, [loadData]);

  if (!project) return null;

  const members = project.project_members || [];
  const displayMembers = members.slice(0, 5);
  const remainingCount = members.length - 5;

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 px-4 sm:px-6 lg:px-0 text-[#0F172A] font-sans">
      
      {/* 1. TOP SECTION: ABOUT & STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-lg font-black tracking-tighter text-[#0F172A] uppercase">{project.name}</h1>
                <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest">
                    {project.status || 'Active'}
                </Badge>
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{project.organisations?.name}</p>
            </div>
            
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <button className="h-9 w-9 flex items-center justify-center rounded-md border border-slate-200 text-[#0F172A] hover:text-[#4F46E5] hover:border-[#4F46E5] transition-all active:scale-95 cursor-pointer">
                  <Settings2 className="h-4 w-4" />
                </button>
              </DialogTrigger>
              <DialogContent className="bg-white max-w-[95vw] sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-lg font-black uppercase">Edit Project Profile</DialogTitle>
                </DialogHeader>
                <CreateProjectForm project={project} organisations={organisations} onSuccess={() => { setIsSettingsOpen(false); loadData(); }} />
              </DialogContent>
            </Dialog>
          </div>
          <div className="text-xs text-slate-500 font-medium leading-relaxed max-w-lg mb-8">
            Management of assets, financial documents, and the roadmap for {project.name}.
          </div>
          <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-slate-50">
             <ActionButton title="Upload" trigger={
               <Button variant="outline" size="sm" className="rounded-md gap-2 border-slate-200 text-[#0F172A] hover:text-[#4F46E5] font-black text-[10px] h-10 px-4 sm:px-6 uppercase cursor-pointer active:scale-95 transition-all">
                 <FileUp className="h-4 w-4" /> Upload
               </Button>
             }>
                <DocumentForm projectId={id} ids={{}} />
             </ActionButton>
             <Link href={`/projects/${id}/documents`} className="flex items-center h-10 px-4 sm:px-6 bg-[#0F172A] text-white rounded-md font-black text-[10px] gap-2 uppercase hover:bg-[#4F46E5] transition-all shadow-md active:scale-95 whitespace-nowrap">
                <FolderOpen className="h-4 w-4" /> Project Vault
             </Link>
          </div>
        </section>

        <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between overflow-hidden">
            <div className="flex items-center gap-2 mb-6">
                <Activity className="h-4 w-4 text-[#4F46E5]" />
                <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest">Project Stats</h3>
            </div>
            <div className="space-y-4">
                <div className="flex items-center justify-between text-xs gap-2">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider whitespace-nowrap">Total Budget</span>
                    <span className="font-black text-[#0F172A] tracking-tight truncate">{project.currency} {project.budget?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs gap-2">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider whitespace-nowrap">End Date</span>
                    <span className="font-black text-[#0F172A] tracking-tight">{project.expected_end_date || 'TBD'}</span>
                </div>
                <div className="flex items-center justify-between text-xs gap-2">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider whitespace-nowrap">Repo</span>
                    <a href={project.repo_link || "#"} target="_blank" className="text-[#4F46E5] font-black hover:underline flex items-center gap-1">Source <Github className="h-3 w-3" /></a>
                </div>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-50 text-xs">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3">Project Members</p>
                <div className="flex items-center -space-x-2">
                    {displayMembers.map((m: any, i: number) => (
                        <div key={i} className="h-8 w-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-600 shadow-sm ring-1 ring-slate-100 uppercase transition-transform hover:-translate-y-1 z-[1]">
                            {m.users?.name?.charAt(0)}
                        </div>
                    ))}
                    {remainingCount > 0 && (
                      <div className="h-8 w-8 rounded-full bg-[#4F46E5] border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-sm ring-1 ring-slate-100 uppercase z-[0]">
                        +{remainingCount}
                      </div>
                    )}
                </div>
            </div>
        </section>
      </div>

      {/* 2. ROADMAP SECTION */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4">
          <h2 className="text-lg font-black tracking-tight text-[#0F172A] uppercase">Project Roadmap</h2>
          <Dialog open={isAddPhaseOpen} onOpenChange={setIsAddPhaseOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[#0F172A] text-white rounded-md text-[10px] font-black h-10 px-8 gap-2 hover:bg-[#4F46E5] transition-all shadow-lg cursor-pointer active:scale-95 w-full sm:w-auto">
                <Plus className="h-4 w-4" /> ADD PHASE
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white max-w-[95vw] sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
               <DialogHeader className="p-6 border-b">
                  <DialogTitle className="text-lg font-black uppercase">Create New Phase</DialogTitle>
               </DialogHeader>
               <div className="flex-1 overflow-y-auto p-6">
                 <PhaseForm projectId={id} onSuccess={() => { setIsAddPhaseOpen(false); loadData(); }} />
               </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {project.phases?.map((phase: any) => (
            <Collapsible key={phase.id} className="group border border-slate-100 rounded-3xl bg-white shadow-sm hover:border-[#4F46E5]/30 transition-all overflow-hidden">
              <div className="flex flex-col md:flex-row items-center justify-between p-1"> 
                <CollapsibleTrigger className="flex items-center gap-3 flex-1 p-2 hover:bg-slate-50 rounded-2xl text-left transition-colors cursor-pointer group w-full">
                  <div className="h-8 w-8 bg-slate-100 rounded-xl flex items-center justify-center group-data-[state=open]:rotate-90 transition-transform group-hover:bg-[#0F172A] group-hover:text-white shrink-0">
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-white" />
                  </div>
                  <span className="font-black text-sm tracking-tight text-slate-800 uppercase truncate">{phase.name}</span>
                </CollapsibleTrigger>
                
                <div className="flex items-center justify-end gap-3 pr-2 w-full md:w-auto p-2 md:p-0">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-md border border-slate-100">
                     <ActionButton title="Upload" trigger={<button className="h-8 w-8 flex items-center justify-center rounded-md text-[#0F172A] hover:text-[#4F46E5] hover:bg-white transition-all cursor-pointer"><FileUp className="h-4 w-4" /></button>}>
                        <DocumentForm projectId={id} ids={{ phase_id: phase.id }} />
                     </ActionButton>
                     <Link href={`/projects/${id}/documents?phaseId=${phase.id}`} className="h-8 w-8 flex items-center justify-center rounded-md text-[#0F172A] hover:text-[#4F46E5] hover:bg-white transition-all cursor-pointer"><FolderOpen className="h-4 w-4" /></Link>
                     <div className="w-[1px] h-4 bg-slate-200 mx-1" />
                     <ActionButton title="Edit" trigger={<button className="h-8 w-8 flex items-center justify-center rounded-md text-[#0F172A] hover:text-[#4F46E5] hover:bg-white transition-all cursor-pointer"><Pencil className="h-4 w-4" /></button>}>
                        <PhaseForm projectId={id} phase={phase} onSuccess={loadData} />
                     </ActionButton>
                     <form action={async () => { if(confirm('Delete phase?')) { await deletePhaseAction(phase.id, id); loadData(); } }}>
                        <button type="submit" className="h-8 w-8 flex items-center justify-center rounded-md text-[#0F172A] hover:text-red-600 hover:bg-white transition-all cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                     </form>
                  </div>
                  
                  <Dialog open={activeMilestonePhase === phase.id} onOpenChange={(open) => setActiveMilestonePhase(open ? phase.id : null)}>
                    <DialogTrigger asChild>
                      <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-[#0F172A] rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-[#4F46E5] hover:text-white transition-all shadow-sm cursor-pointer active:scale-95 border border-indigo-100">
                          <Plus className="h-3 w-3" /> Milestone
                      </button>
                    </DialogTrigger>
                    <DialogContent className="bg-white max-w-[95vw] sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="text-sm font-black uppercase">Add Milestone to {phase.name}</DialogTitle>
                      </DialogHeader>
                      <MilestoneForm projectId={id} phaseId={phase.id} onSuccess={() => { setActiveMilestonePhase(null); loadData(); }} />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <CollapsibleContent className="border-t border-slate-50 bg-slate-50/20">
                <div className="p-4 sm:p-6 sm:pl-20 space-y-3">
                  {phase.milestones?.map((m: any) => (
                    <Link key={m.id} href={`/projects/${id}/phases/${phase.id}/milestones/${m.id}`} className="flex items-center justify-between p-4 sm:p-5 bg-white border border-slate-100 rounded-2xl hover:border-[#4F46E5] hover:shadow-md transition-all group cursor-pointer shadow-sm">
                      <span className="font-black text-slate-700 text-[10px] sm:text-xs tracking-tight uppercase truncate">{m.name}</span>
                      <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                        <Badge variant="outline" className="text-[7px] sm:text-[8px] font-black px-2 sm:px-3 py-0.5 uppercase border-slate-200 text-slate-400 bg-slate-50/50 tracking-widest">{m.status}</Badge>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#4F46E5] transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </section>

      {/* 3. FINANCIALS SECTION */}
   <section className="space-y-6 pt-6 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4">
            <h2 className="text-lg font-black text-[#0F172A] flex items-center gap-3 uppercase tracking-tighter"><ReceiptText className="h-5 w-5 text-[#4F46E5]" /> Financial Records</h2>
            <ActionButton title="Invoice" trigger={
              <button className="bg-[#0F172A] text-white rounded-md text-[10px] font-black uppercase h-10 px-8 hover:bg-[#4F46E5] transition-all cursor-pointer active:scale-95 shadow-lg flex items-center gap-2 w-full sm:w-auto justify-center">
                <Plus className="h-4 w-4" /> New Invoice
              </button>
            }>
              {/* UPDATED: Pass loadData to the invoice form */}
              <InvoiceForm projectId={id} onSuccess={loadData} />
            </ActionButton>
        </div>
        <div className="px-4 sm:px-0">
          {/* UPDATED: Pass loadData to the list for deletions */}
          <InvoiceList 
            invoices={project.invoices || []} 
            projectId={id} 
            organisationName={project.organisations?.name} 
            onRefresh={loadData} 
          />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-10 px-4 sm:px-0">
          <ProjectWiki projectId={id} title="Wiki" showHeader={true} />
          <ProjectThreads projectId={id} title="Discussions" />
      </div>
    </div>
  );
}