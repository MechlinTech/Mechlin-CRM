"use client"

import * as React from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ChevronRight, Plus, Pencil, Trash2, FileUp, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SprintForm } from "@/components/custom/projects/sprint-form";
import { MilestoneForm } from "@/components/custom/projects/milestone-form";
import { deleteMilestoneAction, deleteSprintAction } from "@/actions/hierarchy";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/shared/action-button";
import { DocumentForm } from "@/components/custom/projects/document-form";

export default function MilestonePage({ params }: { params: any }) {
  const router = useRouter();
  const { id, phaseId, milestoneId } = React.use(params) as any;
  const [m, setMilestone] = React.useState<any>(null);
  const [isSprintOpen, setIsSprintOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    const { data } = await supabase.from("milestones").select("*, sprints(*)").eq("id", milestoneId).single();
    setMilestone(data);
  }, [milestoneId]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  if (!m) return null;

  return (
    <div className="max-w-5xl space-y-10 text-black font-sans relative">
      {/* FLOATING ACTION BUTTONS */}
      <div className="absolute -right-4 top-0 translate-x-full space-y-3 hidden xl:block">
          <ActionButton title="Upload Milestone Document" trigger={
              <button className="flex flex-col items-center justify-center h-20 w-20 bg-zinc-900 text-white rounded-3xl shadow-2xl hover:scale-105 transition-all">
                  <FileUp className="h-6 w-6 mb-1" />
                  <span className="text-[8px] font-black uppercase tracking-tighter">Upload</span>
              </button>
          }>
              <DocumentForm projectId={id} ids={{ phase_id: phaseId, milestone_id: milestoneId }} />
          </ActionButton>
          <Link href={`/projects/${id}/documents?milestoneId=${milestoneId}`} className="flex flex-col items-center justify-center h-20 w-20 bg-white border border-zinc-200 text-black rounded-3xl shadow-xl hover:scale-105 transition-all">
              <FolderOpen className="h-6 w-6 mb-1" />
              <span className="text-[8px] font-black uppercase tracking-tighter">Vault</span>
          </Link>
      </div>

      <section className="space-y-8 p-10 bg-white border border-zinc-200 rounded-3xl shadow-sm">
        <div className="flex justify-between items-start border-b border-zinc-100 pb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-2">{m.name}</h1>
            <p className="text-[10px] font-bold uppercase px-4 py-1 bg-zinc-900 text-white inline-block rounded-full shadow-sm">{m.status}</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild><Button variant="outline" size="sm" className="rounded-full gap-2 border-zinc-300 uppercase text-[9px] font-bold h-9 px-5 shadow-sm"><Pencil className="h-3 w-3" /> Edit Milestone</Button></DialogTrigger>
              <DialogContent className="bg-white text-black border-zinc-200 shadow-2xl"><DialogHeader><DialogTitle className="font-black uppercase tracking-widest text-xl">Edit Milestone</DialogTitle></DialogHeader>
                <MilestoneForm projectId={id} phaseId={phaseId} milestone={m} onSuccess={() => { setIsEditOpen(false); fetchData(); }} />
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={async () => { await deleteMilestoneAction(milestoneId, id); router.push(`/projects/${id}`); }} className="rounded-full border-red-200 text-red-600 hover:bg-red-50 uppercase text-[9px] font-bold gap-2 h-9 px-5 shadow-sm"><Trash2 className="h-3 w-3" /> Delete</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-y-10 text-sm">
          <div><p className="text-[9px] font-bold uppercase text-zinc-400 tracking-widest mb-1">Demo Date</p><p className="font-black text-xl text-orange-600">{m.demo_date || "TBD"}</p></div>
          <div><p className="text-[9px] font-bold uppercase text-zinc-400 tracking-widest mb-1">Hours/Budget</p><p className="font-black text-xl text-zinc-900">{m.hours} Hrs / ${m.budget?.toLocaleString()}</p></div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-2xl font-black tracking-tight uppercase">Milestone Sprints</h2>
          <Dialog open={isSprintOpen} onOpenChange={setIsSprintOpen}>
            <DialogTrigger asChild><Button className="h-10 px-8 bg-black text-white rounded-full text-[10px] font-black uppercase gap-2 hover:bg-zinc-800 transition-all shadow-lg"><Plus className="h-3 w-3" /> Add Sprint</Button></DialogTrigger>
            <DialogContent className="bg-white text-black border-zinc-200 shadow-2xl"><DialogHeader><DialogTitle className="font-black uppercase text-xl">Create Sprint cycle</DialogTitle></DialogHeader>
                <SprintForm milestoneId={milestoneId} projectId={id} onSuccess={() => { setIsSprintOpen(false); fetchData(); }} />
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid gap-4">
          {m.sprints?.map((sprint: any) => (
            <div key={sprint.id} className="p-6 bg-zinc-50/30 border border-zinc-100 rounded-[32px] flex items-center justify-between hover:border-black transition-all group shadow-sm">
                <Link href={`/projects/${id}/phases/${phaseId}/milestones/${milestoneId}/sprints/${sprint.id}`} className="flex-1 font-black text-lg uppercase tracking-tighter">{sprint.name}</Link>
                <ChevronRight className="h-5 w-5 text-zinc-300 group-hover:text-black transition-all" />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <MilestoneThreads 
          milestoneId={milestoneId}
          title="Milestone Discussions"
        />
      </section>
    </div>
  );
}