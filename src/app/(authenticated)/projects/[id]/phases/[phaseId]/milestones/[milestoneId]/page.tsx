"use client"

import * as React from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ChevronRight, Plus, Pencil, Trash2, FileUp, FolderOpen, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SprintForm } from "@/components/custom/projects/sprint-form";
import { MilestoneForm } from "@/components/custom/projects/milestone-form";
import { deleteMilestoneAction } from "@/actions/hierarchy";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/shared/action-button";
import { DocumentForm } from "@/components/custom/projects/document-form";
import { MilestoneThreads } from "@/components/custom/threads/MilestoneThreads";
import { cn } from "@/lib/utils";

export default function MilestonePage({ params }: { params: any }) {
  const router = useRouter();
  const { id, phaseId, milestoneId } = React.use(params) as any;
  const [m, setMilestone] = React.useState<any>(null);
  
  // States for auto-closing Dialogs
  const [isSprintOpen, setIsSprintOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    const { data } = await supabase.from("milestones").select("*, sprints(*)").eq("id", milestoneId).single();
    setMilestone(data);
  }, [milestoneId]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  if (!m) return null;

  const statusColor = m.status === 'Active' ? 'bg-yellow-100 text-yellow-700' : 
                    m.status === 'Backlog' ? 'bg-red-100 text-red-700' : 
                    'bg-emerald-100 text-emerald-700';

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 text-[#0F172A] font-sans">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-black tracking-tighter text-[#0F172A] uppercase">{m.name}</h1>
                <Badge className={cn("border-none px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest", statusColor)}>
                    {m.status}
                </Badge>
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Milestone Details</p>
            </div>
            <div className="flex gap-2">
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-md border-slate-200 text-[#0F172A] hover:text-[#4F46E5] hover:border-[#4F46E5] h-9 w-9 cursor-pointer active:scale-95">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white">
                  <DialogHeader><DialogTitle className="text-lg font-black uppercase">Edit Milestone</DialogTitle></DialogHeader>
                  <MilestoneForm projectId={id} phaseId={phaseId} milestone={m} onSuccess={() => { setIsEditOpen(false); fetchData(); }} />
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="icon" onClick={() => confirm('Delete?') && deleteMilestoneAction(milestoneId, id).then(() => router.push(`/projects/${id}`))} className="rounded-md border-slate-200 text-red-600 h-9 w-9 active:scale-95 transition-all">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-slate-500 font-medium leading-relaxed mb-8">
            {m.deliverables || "No deliverables description provided for this milestone."}
          </div>

          <div className="flex items-center gap-4 pt-6 border-t border-slate-50">
             <ActionButton title="Upload" trigger={
               <Button variant="outline" size="sm" className="rounded-md gap-2 border-slate-200 text-[#0F172A] hover:text-[#4F46E5] hover:border-[#4F46E5] font-black text-[10px] h-10 px-6 uppercase active:scale-95 transition-all">
                 <FileUp className="h-4 w-4" /> Upload
               </Button>
             }>
                <DocumentForm projectId={id} ids={{ phase_id: phaseId, milestone_id: milestoneId }} />
             </ActionButton>
             <Link href={`/projects/${id}/documents?milestoneId=${milestoneId}`} className="flex items-center h-10 px-6 bg-[#0F172A] text-white rounded-md font-black text-[10px] gap-2 uppercase hover:bg-[#4F46E5] transition-all shadow-md active:scale-95">
                <FolderOpen className="h-4 w-4" /> Project Vault
             </Link>
          </div>
        </section>

        <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-6">
                <Activity className="h-4 w-4 text-[#4F46E5]" />
                <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest">Milestone Stats</h3>
            </div>
            <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Timeline</span>
                    <span className="font-black text-[#0F172A]">{m.start_date} — {m.end_date}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Budget</span>
                    <span className="font-black text-[#0F172A]">${m.budget?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-50">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Demo Date</span>
                    <p className="font-black text-orange-600">{m.demo_date || "TBD"}</p>
                </div>
            </div>
        </section>
      </div>

      <section className="space-y-6">
        <div className="flex justify-between items-center px-4">
          <h2 className="text-sm font-black tracking-tight text-slate-400 uppercase">Milestone Sprints</h2>
          <Dialog open={isSprintOpen} onOpenChange={setIsSprintOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 px-8 bg-[#0F172A] text-white rounded-md text-[10px] font-black uppercase gap-2 hover:bg-[#4F46E5] shadow-lg active:scale-95">
                <Plus className="h-4 w-4" /> Add Sprint
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader><DialogTitle className="text-lg font-black uppercase">Create Sprint Cycle</DialogTitle></DialogHeader>
              <SprintForm milestoneId={milestoneId} projectId={id} onSuccess={() => { setIsSprintOpen(false); fetchData(); }} />
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid gap-3">
          {m.sprints?.map((sprint: any) => (
            <div key={sprint.id} className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-[#4F46E5] transition-all group shadow-sm">
                <Link href={`/projects/${id}/phases/${phaseId}/milestones/${milestoneId}/sprints/${sprint.id}`} className="flex-1 font-black text-xs uppercase text-slate-700">{sprint.name}</Link>
                <div className="flex items-center gap-4">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Starts: {sprint.start_date || 'TBD'}</span>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#4F46E5] transition-all" />
                </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 border-t border-slate-100 pt-8">
        <MilestoneThreads milestoneId={milestoneId} title="Discussions" />
      </section>
    </div>
  );
}