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

  const statusColor = sprint.status === 'Active' ? 'text-[#006AFF] border-[#006AFF]/20 bg-[#006AFF]/5' : 
                    sprint.status === 'Suspended' ? 'text-red-500 border-red-500/20 bg-red-50/50' : 
                    'text-emerald-600 border-emerald-500/20 bg-emerald-50/50';

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 px-4 sm:px-6 lg:px-0 text-[#0F172A] font-sans">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold tracking-tight">{sprint.name}</h1>
                <Badge variant="outline" className={cn("px-3 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider", statusColor)}>
                    {sprint.status || 'Pending'}
                </Badge>
              </div>
              <p className="text-sm font-medium text-slate-500">Sprint Execution</p>
            </div>
            <div className="flex gap-2">
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <button className="h-9 w-9 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-[#006AFF] hover:border-[#006AFF] transition-all active:scale-95 bg-white cursor-pointer">
                    <Pencil className="h-4 w-4" />
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-white border-none shadow-2xl">
                  <DialogHeader><DialogTitle className="text-lg font-semibold">Edit Sprint</DialogTitle></DialogHeader>
                  <SprintForm projectId={id} milestoneId={milestoneId} sprint={sprint} onSuccess={() => { setIsEditOpen(false); fetchData(); }} />
                </DialogContent>
              </Dialog>
              <button 
                onClick={() => confirm('Delete?') && deleteSprintAction(sprintId, id).then(() => router.back())} 
                className="h-9 w-9 flex items-center justify-center rounded-md border border-slate-200 text-red-500 hover:bg-red-50 transition-all active:scale-95 bg-white cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="text-sm text-slate-500 font-normal leading-relaxed max-w-lg mb-8">
            {sprint.description || "Active sprint phase focusing on task execution and milestone deliverables."}
          </div>
          <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-slate-100">
             <ActionButton title="Upload" trigger={
               <Button variant="secondary" className="h-10 w-32 cursor-pointer">
                 <FileUp className="h-4 w-4" /> Upload
               </Button>
             }>
                <DocumentForm projectId={id} ids={{ phase_id: phaseId, milestone_id: milestoneId, sprint_id: sprintId }} />
             </ActionButton>
             <Link href={`/projects/${id}/documents?sprintId=${sprintId}`} className="flex items-center justify-center h-10 w-32 bg-[#006AFF] text-white rounded-md font-semibold text-xs gap-2 hover:bg-[#99C4FF] transition-all shadow-md active:scale-95 whitespace-nowrap cursor-pointer">
                <FolderOpen className="h-4 w-4" /> View Doc
             </Link>
          </div>
        </section>

        <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between overflow-hidden">
            <div className="flex items-center gap-2 mb-6">
                <Activity className="h-4 w-4 text-[#006AFF]" />
                <h3 className="text-sm font-semibold tracking-wide uppercase">Sprint Stats</h3>
            </div>
            <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium uppercase tracking-wider">Starts</span>
                    <span className="font-semibold text-slate-900">{sprint.start_date || 'TBD'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium uppercase tracking-wider">Ends</span>
                    <span className="font-semibold text-slate-900">{sprint.end_date || 'TBD'}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-100">
                    <span className="text-slate-400 font-medium uppercase tracking-wider">Tasks</span>
                    <span className="font-semibold ">{sprint.tasks?.length || 0} Units</span>
                </div>
            </div>
        </section>
      </div>

      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#006AFF]" /> Task Backlog
            </h2>
            <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
              <DialogTrigger asChild>
                <Button className="cursor-pointer">
                  <Plus className="h-4 w-4" /> New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-[50vw] w-full max-h-[90vh] bg-white flex flex-col border-none shadow-2xl overflow-hidden rounded-[24px]">
                <DialogHeader className="p-6 border-b"><DialogTitle className="text-lg font-semibold">Create Task</DialogTitle></DialogHeader>
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                   <TaskForm ids={{ project_id: id, phase_id: phaseId, milestone_id: milestoneId, sprint_id: sprintId }} onSuccess={() => { setIsAddTaskOpen(false); fetchData(); }} />
                </div>
              </DialogContent>
            </Dialog>
        </div>
        
        <div className="grid gap-3">
          {sprint.tasks?.map((task: any) => (
            <div key={task.id} className="p-5 bg-white border border-slate-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between hover:border-[#006AFF]/30 transition-all group shadow-sm gap-4">
                <div className="space-y-1">
                    <p className="font-semibold text-sm text-slate-700 tracking-tight">{task.title}</p>
                    <div className="text-xs text-slate-400 font-normal leading-relaxed line-clamp-1 prose prose-slate prose-xs" dangerouslySetInnerHTML={{ __html: task.description || "" }} />
                </div>
                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                    <ActionButton title="Edit" trigger={<button className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-100 text-slate-400 hover:text-[#006AFF] bg-white active:scale-95 transition-all cursor-pointer"><Pencil className="h-3.5 w-3.5" /></button>}>
                        <TaskForm task={task} ids={{ project_id: id, phase_id: phaseId, milestone_id: milestoneId, sprint_id: sprintId }} onSuccess={fetchData} />
                    </ActionButton>
                    <button onClick={() => deleteTaskAction(task.id, id).then(fetchData)} className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-100 text-slate-300 hover:text-red-600 bg-white active:scale-95 transition-all cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 border-t border-slate-100 pt-10">
        <SprintThreads sprintId={sprintId} title="Discussions" />
      </section>
    </div>
  );
}