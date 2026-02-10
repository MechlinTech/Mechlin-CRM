// src/app/(authenticated)/projects/[id]/phases/[phaseId]/milestones/[milestoneId]/sprints/[sprintId]/page.tsx
"use client"

import * as React from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Pencil, Plus, Trash2, CheckCircle2, FileUp, FolderOpen, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SprintForm } from "@/components/custom/projects/sprint-form";
import { ActionButton } from "@/components/shared/action-button";
import { TaskForm } from "@/components/custom/projects/task-form";
import { DocumentForm } from "@/components/custom/projects/document-form";
import { deleteSprintAction, deleteTaskAction } from "@/actions/hierarchy";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SprintThreads } from "@/components/custom/threads/SprintThreads";

export default function SprintPage({ params }: { params: any }) {
  const router = useRouter();
  const { id, phaseId, milestoneId, sprintId } = React.use(params) as any;
  const [sprint, setSprint] = React.useState<any>(null);
  
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    const { data } = await supabase.from("sprints").select("*, tasks(*)").eq("id", sprintId).single();
    if (data?.tasks) data.tasks.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setSprint(data);
  }, [sprintId]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  if (!sprint) return null;

  const statusColor = sprint.status === 'Active' ? 'bg-yellow-100 text-yellow-700' : 
                    sprint.status === 'Suspended' ? 'bg-red-100 text-red-700' : 
                    'bg-emerald-100 text-emerald-700';

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 text-[#0F172A] font-sans">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-black tracking-tighter uppercase text-[#0F172A]">{sprint.name}</h1>
                <Badge className={cn("border-none px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest", statusColor)}>
                    {sprint.status || 'Pending'}
                </Badge>
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sprint Execution</p>
            </div>
            <div className="flex gap-2">
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-md border-slate-200 text-[#0F172A] hover:text-[#4F46E5] hover:border-[#4F46E5] h-9 w-9 cursor-pointer active:scale-95 transition-all">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white">
                  <DialogHeader><DialogTitle className="text-lg font-black uppercase">Edit Sprint</DialogTitle></DialogHeader>
                  <SprintForm projectId={id} milestoneId={milestoneId} sprint={sprint} onSuccess={() => { setIsEditOpen(false); fetchData(); }} />
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="icon" onClick={() => confirm('Delete?') && deleteSprintAction(sprintId, id).then(() => router.back())} className="rounded-md border-slate-200 text-red-600 h-9 w-9 active:scale-95 transition-all">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="text-xs text-slate-500 font-medium leading-relaxed mb-8">
            {sprint.description || "Active sprint phase focusing on task execution and milestone deliverables."}
          </div>
          <div className="flex items-center gap-4 pt-6 border-t border-slate-50">
             <ActionButton title="Upload" trigger={
               <Button variant="outline" size="sm" className="rounded-md gap-2 border-slate-200 text-[#0F172A] hover:text-[#4F46E5] hover:border-[#4F46E5] font-black text-[10px] h-10 px-6 uppercase active:scale-95 transition-all">
                 <FileUp className="h-4 w-4" /> Upload
               </Button>
             }>
                <DocumentForm projectId={id} ids={{ phase_id: phaseId, milestone_id: milestoneId, sprint_id: sprintId }} />
             </ActionButton>
             <Link href={`/projects/${id}/documents?sprintId=${sprintId}`} className="flex items-center h-10 px-6 bg-[#0F172A] text-white rounded-md font-black text-[10px] gap-2 uppercase hover:bg-[#4F46E5] transition-all shadow-md active:scale-95">
                <FolderOpen className="h-4 w-4" /> Project Vault
             </Link>
          </div>
        </section>

        <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-6">
                <Activity className="h-4 w-4 text-[#4F46E5]" />
                <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest">Sprint Stats</h3>
            </div>
            <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Starts</span>
                    <span className="font-black text-[#0F172A]">{sprint.start_date || 'TBD'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Ends</span>
                    <span className="font-black text-[#0F172A]">{sprint.end_date || 'TBD'}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-50">
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Tasks</span>
                    <span className="font-black text-indigo-600">{sprint.tasks?.length || 0} Units</span>
                </div>
            </div>
        </section>
      </div>

      <section className="space-y-6">
        <div className="flex justify-between items-center px-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#4F46E5]" /> Task Backlog
            </h2>
            <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-md bg-[#0F172A] text-white h-10 px-8 font-black uppercase text-[10px] gap-2 hover:bg-[#4F46E5] shadow-lg active:scale-95">
                  <Plus className="h-4 w-4" /> New Task
                </Button>
              </DialogTrigger>
              {/* Changed: Adjusted max-h and added flex-col for internal scrolling */}
              <DialogContent className="max-w-[90vw] sm:max-w-[50vw] w-full max-h-[90vh] bg-white flex flex-col">
                <DialogHeader><DialogTitle className="text-sm font-black uppercase">Create Task</DialogTitle></DialogHeader>
                <div className="flex-1 overflow-y-auto pr-2">
                   <TaskForm ids={{ project_id: id, phase_id: phaseId, milestone_id: milestoneId, sprint_id: sprintId }} onSuccess={() => { setIsAddTaskOpen(false); fetchData(); }} />
                </div>
              </DialogContent>
            </Dialog>
        </div>
        
        <div className="grid gap-3">
          {sprint.tasks?.map((task: any) => (
            <div key={task.id} className="p-5 bg-white border border-slate-100 rounded-3xl flex items-center justify-between hover:border-[#4F46E5] transition-all group shadow-sm">
                <div className="space-y-1">
                    <p className="font-black text-xs uppercase tracking-tight text-slate-700">{task.title}</p>
                    <div className="text-xs text-slate-400 leading-relaxed line-clamp-1 prose prose-slate prose-xs" dangerouslySetInnerHTML={{ __html: task.description || "" }} />
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ActionButton title="Edit" trigger={<button className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-100 text-slate-400 hover:text-[#0F172A] active:scale-95 transition-all"><Pencil className="h-3.5 w-3.5" /></button>}>
                        <TaskForm task={task} ids={{ project_id: id, phase_id: phaseId, milestone_id: milestoneId, sprint_id: sprintId }} onSuccess={fetchData} />
                    </ActionButton>
                    <button onClick={() => deleteTaskAction(task.id, id).then(fetchData)} className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-100 text-slate-300 hover:text-red-600 active:scale-95 transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 border-t border-slate-100 pt-8">
        <SprintThreads sprintId={sprintId} title="Discussions" />
      </section>
    </div>
  );
}