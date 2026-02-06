import { supabase } from "@/lib/supabase";
import { ChevronRight, Plus, Pencil, Settings2, Trash2, ReceiptText, FolderOpen, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { notFound } from "next/navigation";
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
 
export default async function ProjectOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
 
  const { data: project, error } = await supabase
    .from("projects")
    .select("*, organisations(*), phases(*, milestones(*)), invoices(*)")
    .eq("id", id)
    .single();
 
  const { data: organisations } = await supabase.from("organisations").select("*");
 
  if (!project || error) notFound();
 
  return (
    <div className="max-w-5xl space-y-12 pb-20 text-black font-sans relative">
      
      {/* GLOBAL DOCUMENT ACTIONS (POSITIONED IN THE GAP) */}
      <div className="absolute -right-4 top-0 translate-x-full space-y-3 hidden xl:block">
          <ActionButton title="Upload Global Document" trigger={
              <button className="flex flex-col items-center justify-center h-20 w-20 bg-black text-white rounded-3xl shadow-2xl hover:scale-105 transition-all">
                  <FileUp className="h-6 w-6 mb-1" />
                  <span className="text-[8px] font-black uppercase tracking-tighter">Upload</span>
              </button>
          }>
              <DocumentForm projectId={id} ids={{}} />
          </ActionButton>
          <Link href={`/projects/${id}/documents`} className="flex flex-col items-center justify-center h-20 w-20 bg-white border border-zinc-200 text-black rounded-3xl shadow-xl hover:scale-105 transition-all">
              <FolderOpen className="h-6 w-6 mb-1" />
              <span className="text-[8px] font-black uppercase tracking-tighter">Vault</span>
          </Link>
      </div>

      {/* 1. PROJECT DETAILS SECTION */}
      <section className="p-10 border border-zinc-200 rounded-[32px] bg-zinc-50/30 shadow-sm">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-5xl font-black tracking-tighter mb-2">{project.name}</h1>
            <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">{project.organisations?.name}</p>
          </div>
          <ActionButton title="Edit Project Profile" trigger={<Button variant="outline" size="sm" className="rounded-full gap-2 border-zinc-300 font-black uppercase text-[9px] h-9 px-5"><Settings2 className="h-3.5 w-3.5" /> Project Settings</Button>}>
            <CreateProjectForm project={project} organisations={organisations} />
          </ActionButton>
        </div>
        <div className="grid grid-cols-3 gap-12 border-t border-zinc-100 pt-8">
          <div><p className="text-[9px] font-bold uppercase text-zinc-400 mb-2">Total Budget</p><p className="font-black text-xl">{project.currency} {project.budget?.toLocaleString()}</p></div>
          <div><p className="text-[9px] font-bold uppercase text-zinc-400 mb-2">Project Period</p><p className="font-black text-xl">{project.start_date} — {project.expected_end_date || 'TBD'}</p></div>
          <div className="col-span-1"><p className="text-[9px] font-bold uppercase text-zinc-400 mb-2">Source Code</p><a href={project.repo_link} target="_blank" className="text-blue-600 font-bold truncate block hover:underline text-sm">{project.repo_link || 'No Repo Linked'}</a></div>
        </div>
      </section>

      {/* 2. ROADMAP SECTION */}
      <section className="space-y-8">
        <div className="flex justify-between items-center px-4">
          <h2 className="text-3xl font-black tracking-tighter">Project Roadmap</h2>
          <ActionButton title="Add New Phase" trigger={<Button className="h-10 px-8 bg-black text-white rounded-full text-xs font-black gap-2 hover:bg-zinc-800 shadow-lg transition-all"><Plus className="h-4 w-4" /> Add Phase</Button>}>
            <PhaseForm projectId={id} />
          </ActionButton>
        </div>

        <div className="space-y-6">
          {project.phases?.map((phase: any) => (
            <Collapsible key={phase.id} className="group border border-zinc-200 rounded-[24px] bg-white shadow-sm overflow-hidden transition-all hover:border-black">
              <div className="flex items-center justify-between p-3">
                <CollapsibleTrigger className="flex items-center gap-5 flex-1 p-5 hover:bg-zinc-50 transition-colors rounded-xl text-black text-left">
                  <div className="h-10 w-10 bg-zinc-100 rounded-full flex items-center justify-center transition-transform group-data-[state=open]:rotate-90"><ChevronRight className="h-5 w-5 text-zinc-500" /></div>
                  <span className="font-black text-2xl tracking-tighter">{phase.name}</span>
                </CollapsibleTrigger>
                <div className="flex gap-3 pr-6 items-center">
                  
                  {/* PHASE DOCUMENT ACTIONS */}
                  <div className="flex items-center gap-2 pr-4 border-r border-zinc-100 mr-2">
                     <ActionButton title="Upload Phase Asset" trigger={<button className="p-2 bg-zinc-50 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-all"><FileUp className="h-4 w-4" /></button>}>
                        <DocumentForm projectId={id} ids={{ phase_id: phase.id }} />
                     </ActionButton>
                     <Link href={`/projects/${id}/documents?phaseId=${phase.id}`} className="p-2 bg-zinc-50 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-all"><FolderOpen className="h-4 w-4" /></Link>
                  </div>

                  <ActionButton title="Edit Phase" trigger={<div className="p-2 text-zinc-300 hover:text-black transition-colors cursor-pointer"><Pencil className="h-4 w-4" /></div>}>
                    <PhaseForm projectId={id} phase={phase} />
                  </ActionButton>
                  
                  <form action={async () => { "use server"; await deletePhaseAction(phase.id, id); }}>
                    <button type="submit" className="p-2 text-zinc-300 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </form>

                  <ActionButton title="Configure Milestone" trigger={<Button size="sm" className="bg-zinc-900 text-white hover:bg-black rounded-full h-8 px-4 text-[9px] font-black uppercase shadow-sm transition-all"><Plus className="h-3 w-3 mr-1" /> Milestone</Button>}>
                    <MilestoneForm projectId={id} phaseId={phase.id} />
                  </ActionButton>
                </div>
              </div>
              
              <CollapsibleContent className="border-t border-zinc-100 bg-zinc-50/30">
                <div className="p-6 pl-16 space-y-3">
                  {phase.milestones?.length > 0 ? phase.milestones.map((m: any) => (
                    <Link key={m.id} href={`/projects/${id}/phases/${phase.id}/milestones/${m.id}`}
                      className="flex items-center justify-between p-5 bg-white border border-zinc-100 rounded-2xl hover:border-black transition-all group shadow-sm">
                      <span className="font-black text-base tracking-tight">{m.name}</span>
                      <div className="flex items-center gap-5">
                        <Badge variant="outline" className="text-[10px] font-black px-4 py-1 uppercase">{m.status}</Badge>
                        <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-black transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  )) : <p className="text-xs text-zinc-400 italic py-4 font-medium">No milestones defined.</p>}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </section>

      {/* 3. INVOICES SECTION */}
      <section className="space-y-8 pt-8 border-t border-zinc-100">
        <div className="flex justify-between items-center px-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-black rounded-full flex items-center justify-center shadow-lg"><ReceiptText className="h-5 w-5 text-white" /></div>
            <h2 className="text-3xl font-black tracking-tighter text-zinc-900">Billing & Invoices</h2>
          </div>
          <ActionButton title="Upload Project Invoice" trigger={<Button variant="outline" className="rounded-full h-10 px-8 font-black uppercase text-[10px] gap-2 border-zinc-300 hover:bg-black hover:text-white shadow-sm"><Plus className="h-4 w-4" /> New Invoice</Button>}>
            <InvoiceForm projectId={id} />
          </ActionButton>
        </div>
        <InvoiceList invoices={project.invoices || []} projectId={id} organisationName={project.organisations?.name} />
      </section>

      {/* 4. PROJECT WIKI SECTION */}
      <section className="space-y-4 pt-8 border-t border-zinc-100">
        <ProjectWiki projectId={id} title="Project Documentation" showHeader={true} />
      </section>
    </div>
  );
}