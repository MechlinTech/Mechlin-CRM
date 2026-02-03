import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ChevronRight, Plus, Pencil, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { notFound } from "next/navigation";
import { PhaseForm } from "@/components/custom/projects/phase-form";
import { MilestoneForm } from "@/components/custom/projects/milestone-form";
import { CreateProjectForm } from "@/components/custom/projects/create-project-form";
import { deletePhaseAction } from "@/actions/hierarchy";

// Note: To make the Dialog close automatically, ensure the PhaseForm/MilestoneForm 
// triggers a state change or refresh that closes the parent modal.
export default async function ProjectOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const { data: project } = await supabase.from("projects").select("*, organisations(*), phases(*, milestones(*))").eq("id", id).single();
  const { data: organisations } = await supabase.from("organisations").select("*");

  if (!project) notFound();

  return (
    <div className="max-w-5xl space-y-12 pb-20 text-black">
      {/* 1. PROJECT DETAILS SECTION */}
      <section className="p-8 border border-zinc-200 rounded-3xl bg-zinc-50/30">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-5xl font-black tracking-tighter mb-2">{project.name}</h1>
            <p className="text-zinc-500 font-medium">{project.organisations?.name}</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full gap-2 border-zinc-300 font-bold uppercase text-[10px]">
                <Settings2 className="h-3 w-3" /> Edit Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white">
              <DialogHeader><DialogTitle>Edit Project Profile</DialogTitle></DialogHeader>
              <CreateProjectForm project={project} organisations={organisations} />
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-4 gap-10">
          <div><p className="text-[9px] font-bold uppercase text-zinc-400 mb-1">Budget</p><p className="font-bold text-lg">{project.currency} {project.budget?.toLocaleString()}</p></div>
          <div><p className="text-[9px] font-bold uppercase text-zinc-400 mb-1">Timeline</p><p className="font-bold text-lg">{project.start_date} — {project.expected_end_date || 'TBD'}</p></div>
          <div className="col-span-2"><p className="text-[9px] font-bold uppercase text-zinc-400 mb-1">Repository Link</p>
          <a href={project.repo_link} target="_blank" className="text-blue-600 font-medium truncate block hover:underline text-sm">{project.repo_link || 'Link Repository'}</a></div>
        </div>
      </section>

      {/* 2. COLLAPSIBLE HIERARCHY: PHASES -> MILESTONES */}
      <section className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-2xl font-black tracking-tight">Project Roadmap</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="h-9 px-6 bg-black text-white rounded-full text-xs font-bold gap-2 hover:bg-zinc-800">
                <Plus className="h-4 w-4" /> Add New Phase
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader><DialogTitle>Add Project Phase</DialogTitle></DialogHeader>
              <PhaseForm projectId={id} />
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="space-y-4">
          {project.phases?.map((phase: any) => (
            <Collapsible key={phase.id} className="group border border-zinc-200 rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-2">
                <CollapsibleTrigger className="flex items-center gap-4 flex-1 p-4 hover:bg-zinc-50 transition-colors">
                  <ChevronRight className="h-4 w-4 text-zinc-400 transition-transform group-data-[state=open]:rotate-90" />
                  <span className="font-black text-lg">{phase.name}</span>
                </CollapsibleTrigger>
                <div className="flex gap-2 pr-4 items-center">
                  <Dialog>
                    <DialogTrigger asChild>
                       <button className="p-2 hover:bg-zinc-100 rounded-full"><Pencil className="h-3.5 w-3.5 text-zinc-400 hover:text-black" /></button>
                    </DialogTrigger>
                    <DialogContent className="bg-white"><DialogHeader><DialogTitle>Edit Phase</DialogTitle></DialogHeader><PhaseForm projectId={id} phase={phase} /></DialogContent>
                  </Dialog>
                  
                  <form action={async () => { "use server"; await deletePhaseAction(phase.id, id); }}>
                    <button type="submit" className="p-2 hover:bg-red-50 rounded-full text-zinc-400 hover:text-red-600 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-[9px] font-bold uppercase text-zinc-500 hover:text-black">+ Milestone</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl bg-white">
                      <DialogHeader><DialogTitle>Create Milestone</DialogTitle></DialogHeader>
                      <MilestoneForm projectId={id} phaseId={phase.id} />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              <CollapsibleContent className="border-t border-zinc-100 bg-zinc-50/50">
                <div className="p-4 pl-12 space-y-2">
                  {phase.milestones?.map((m: any) => (
                    <Link key={m.id} href={`/projects/${id}/phases/${phase.id}/milestones/${m.id}`}
                      className="flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-xl hover:border-black transition-all group shadow-sm">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{m.name}</span>
                        <span className="text-[10px] text-zinc-400 font-medium tracking-tight uppercase">Budget: {project.currency} {m.budget}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-bold px-3 py-1 bg-zinc-100 rounded-full uppercase">{m.status}</span>
                        <ChevronRight className="h-3 w-3 text-zinc-300 group-hover:text-black" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </section>
    </div>
  );
}