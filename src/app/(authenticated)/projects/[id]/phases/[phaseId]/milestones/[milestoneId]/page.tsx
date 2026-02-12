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
  
  const [isSprintOpen, setIsSprintOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    const { data } = await supabase.from("milestones").select("*, sprints(*)").eq("id", milestoneId).single();
    setMilestone(data);
  }, [milestoneId]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  if (!m) return null;

  // Consistent Status mapping with Brand Colors
  const statusColor = m.status === 'Active' ? 'text-[#006AFF] border-[#006AFF]/20 bg-[#006AFF]/5' : 
                    m.status === 'Backlog' ? 'text-red-500 border-red-500/20 bg-red-50/50' : 
                    'text-emerald-600 border-emerald-500/20 bg-emerald-50/50';

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 px-4 sm:px-6 lg:px-0 text-[#0F172A] font-sans">
      
      {/* 1. TOP SECTION: ABOUT & STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                {/* Heading: SemiBold */}
                <h1 className="text-xl font-semibold tracking-tight">{m.name}</h1>
                <Badge variant="outline" className={cn("px-3 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider", statusColor)}>
                    {m.status}
                </Badge>
              </div>
              <p className="text-sm font-medium text-slate-500">Milestone Details</p>
            </div>
            <div className="flex gap-2">
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <button className="h-9 w-9 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-[#006AFF] hover:border-[#006AFF] transition-all active:scale-95 bg-white cursor-pointer">
                    <Pencil className="h-4 w-4" />
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-white border-none shadow-2xl">
                  <DialogHeader><DialogTitle className="text-lg font-semibold">Edit Milestone</DialogTitle></DialogHeader>
                  <MilestoneForm projectId={id} phaseId={phaseId} milestone={m} onSuccess={() => { setIsEditOpen(false); fetchData(); }} />
                </DialogContent>
              </Dialog>
              <button 
                onClick={() => confirm('Delete?') && deleteMilestoneAction(milestoneId, id).then(() => router.push(`/projects/${id}`))} 
                className="h-9 w-9 flex items-center justify-center rounded-md border border-slate-200 text-red-500 hover:bg-red-50 transition-all active:scale-95 bg-white cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="text-sm text-slate-500 font-normal leading-relaxed max-w-lg mb-8">
            {m.deliverables || "No deliverables description provided for this milestone."}
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-slate-100">
             <ActionButton title="Upload" trigger={
               <Button variant="secondary" className="h-10 w-32 cursor-pointer">
                 <FileUp className="h-4 w-4" /> Upload
               </Button>
             }>
                <DocumentForm projectId={id} ids={{ phase_id: phaseId, milestone_id: milestoneId }} />
             </ActionButton>
             {/* Updated Link to be identical to Project Overview "View Doc" */}
             <Link href={`/projects/${id}/documents?milestoneId=${milestoneId}`} className="flex items-center justify-center h-10 w-32 bg-[#006AFF] text-white rounded-md font-semibold text-xs gap-2 hover:bg-[#99C4FF] transition-all shadow-md active:scale-95 whitespace-nowrap cursor-pointer">
                <FolderOpen className="h-4 w-4" /> View Doc
             </Link>
          </div>
        </section>

        <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between overflow-hidden">
            <div className="flex items-center gap-2 mb-6">
                <Activity className="h-4 w-4 text-[#006AFF]" />
                <h3 className="text-sm font-semibold tracking-wide uppercase">Milestone Stats</h3>
            </div>
            <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium uppercase tracking-wider">Timeline</span>
                    <span className="font-semibold text-slate-900">{m.start_date} — {m.end_date}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium uppercase tracking-wider">Budget</span>
                    <span className="font-semibold text-slate-900">${m.budget?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-100">
                    <span className="text-slate-400 font-medium uppercase tracking-wider">Demo Date</span>
                    <p className="font-semibold ">{m.demo_date || "TBD"}</p>
                </div>
            </div>
        </section>
      </div>

      {/* 2. SPRINTS SECTION */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Milestone Sprints</h2>
          <Dialog open={isSprintOpen} onOpenChange={setIsSprintOpen}>
            <DialogTrigger asChild>
              <Button className="cursor-pointer">
                <Plus className="h-4 w-4" /> Add Sprint
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-none shadow-2xl">
              <DialogHeader><DialogTitle className="text-lg font-semibold">Create Sprint Cycle</DialogTitle></DialogHeader>
              <SprintForm milestoneId={milestoneId} projectId={id} onSuccess={() => { setIsSprintOpen(false); fetchData(); }} />
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid gap-4">
          {m.sprints?.map((sprint: any) => (
            <div key={sprint.id} className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-[#006AFF]/30 transition-all group shadow-sm ring-1 ring-slate-50">
                <Link href={`/projects/${id}/phases/${phaseId}/milestones/${milestoneId}/sprints/${sprint.id}`} className="flex-1 font-medium text-sm text-slate-700 hover:text-[#006AFF] transition-colors cursor-pointer">{sprint.name}</Link>
                <div className="flex items-center gap-5">
                  <span className="text-[10px] font-normal text-slate-400">Starts: {sprint.start_date || 'TBD'}</span>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#006AFF] transition-all group-hover:translate-x-1" />
                </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. DISCUSSIONS SECTION */}
      <section className="mt-8 border-t border-slate-100 pt-10">
        <MilestoneThreads milestoneId={milestoneId} title="Discussions" />
      </section>
    </div>
  );
}