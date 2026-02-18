"use client"

import * as React from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Pencil, Plus, Trash2, CheckCircle2, FileUp, FolderOpen, Activity, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SprintForm } from "@/components/custom/projects/sprint-form";
import { ActionButton } from "@/components/shared/action-button";
import { TaskForm } from "@/components/custom/projects/task-form";
import { DocumentForm } from "@/components/custom/projects/document-form";
import { deleteSprintAction, deleteTaskAction } from "@/actions/hierarchy";
import { redirect, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SprintThreads } from "@/components/custom/threads/SprintThreads";
import { useRBAC } from "@/context/rbac-context"; 

function TaskItem({ task, ids, onRefresh }: { task: any, ids: any, onRefresh: () => void }) {
  const [open, setOpen] = React.useState(false);
  const { hasPermission, loading } = useRBAC(); 

    if(!loading && !hasPermission('sprints.read')) {
          redirect('/unauthorized');
    }
  

  const handleSuccess = () => {
    setOpen(false);
    setTimeout(() => { onRefresh(); }, 100);
  };
 
  const taskStatusStyles = 
    task.status === 'Pending' ? 'text-amber-500 border-amber-500/20 bg-amber-500/10' : 
    task.status === 'In Progress' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-50/10' : 
    task.status === 'Completed' ? 'text-rose-500 border-rose-500/20 bg-rose-500/10' : 
    'text-slate-500 border-slate-200 bg-slate-50';

  return (
   <>
      {hasPermission('tasks.read') && (
         <div className="p-5 bg-white border border-slate-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between hover:border-[#006AFF]/30 transition-all group shadow-sm gap-4">
      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-3">
            <p className="font-semibold text-sm text-slate-700 tracking-tight">{task.title}</p>
            <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 text-[9px] font-medium border uppercase tracking-wider", taskStatusStyles)}>
                {task.status || 'Pending'}
            </Badge>
        </div>
        <div className="text-xs text-slate-400 font-normal leading-relaxed line-clamp-1 prose prose-slate prose-xs" dangerouslySetInnerHTML={{ __html: task.description || "" }} />
      </div>

      <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
        {!loading && hasPermission('tasks.read') && (
          <Dialog>
              <DialogTrigger asChild>
                  <button className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-100 text-slate-400 hover:text-[#006AFF] bg-white active:scale-95 transition-all cursor-pointer"><Eye className="h-3.5 w-3.5" /></button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] md:min-w-[80vw] bg-white text-slate-900 border-none shadow-2xl p-0 overflow-hidden rounded-[24px] flex flex-col min-h-[70vh]">
                  <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100 shrink-0">
                      <DialogTitle className="font-semibold text-sm uppercase tracking-tight flex items-center justify-between pr-8">
                          <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-[#006AFF]" /> Task Details</div>
                      </DialogTitle>
                  </DialogHeader>
                  <div className="p-8 flex-1 overflow-y-auto">
                      <h2 className="text-xl font-semibold mb-6 text-[#0F172A]">{task.title}</h2>
                      <div className="prose prose-slate prose-sm max-w-none font-normal text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: task.description || "No description provided." }} />
                  </div>
              </DialogContent>
          </Dialog>
        )}

        {!loading && hasPermission('tasks.update') && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-100 text-slate-400 hover:text-[#006AFF] bg-white active:scale-95 transition-all cursor-pointer"><Pencil className="h-3.5 w-3.5" /></button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-[50vw] w-full max-h-[90vh] bg-white flex flex-col border-none shadow-2xl overflow-hidden rounded-[24px]">
              <DialogHeader className="p-6 border-b"><DialogTitle className="text-lg font-semibold tracking-tight">Edit Task</DialogTitle></DialogHeader>
              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <TaskForm task={task} ids={ids} onSuccess={handleSuccess} />
              </div>
            </DialogContent>
          </Dialog>
        )}

        {!loading && hasPermission('tasks.delete') && (
          <button onClick={() => confirm('Delete task?') && deleteTaskAction(task.id, ids.project_id).then(onRefresh)} className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-100 text-slate-300 hover:text-red-600 bg-white active:scale-95 transition-all cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
        )}
      </div>
    </div> 
   )}
    </>
  );
}

export default function SprintPage({ params }: { params: any }) {
  const router = useRouter();
  const { id, phaseId, milestoneId, sprintId } = React.use(params) as any;
  const [sprint, setSprint] = React.useState<any>(null);
  const { hasPermission, loading } = useRBAC(); 
  
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    const { data: sprintData, error } = await supabase.from("sprints").select("*").eq("id", sprintId).single();
    if (error) return;
    const { data: tasksData } = await supabase.from("tasks").select("*").eq("sprint_id", sprintId).order("created_at", { ascending: false });
    setSprint({ ...sprintData, tasks: tasksData || [] });
  }, [sprintId]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  if (!sprint) return null;

  const statusColor = sprint.status === 'Active' ? 'text-[#006AFF] border-[#006AFF]/20 bg-[#006AFF]/5' : 
                    sprint.status === 'Suspended' ? 'text-red-500 border-red-500/20 bg-red-50/50' : 
                    'text-emerald-600 border-emerald-500/20 bg-emerald-50/50';

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 px-4 sm:px-6 lg:px-0 text-[#0F172A] font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <section className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold tracking-tight">{sprint.name}</h1>
                <Badge variant="outline" className={cn("px-3 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider", statusColor)}>{sprint.status || 'Pending'}</Badge>
              </div>
              <p className="text-sm font-medium text-slate-500">Sprint Execution</p>
            </div>
            <div className="flex gap-2">
              {!loading && hasPermission('sprints.update') && (
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <DialogTrigger asChild>
                    <button className="h-9 w-9 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-[#006AFF] transition-all active:scale-95 bg-white cursor-pointer"><Pencil className="h-4 w-4" /></button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-[50vw] w-full max-h-[90vh] bg-white border-none shadow-2xl overflow-hidden rounded-[24px]">
                    <DialogHeader className="p-6 border-b"><DialogTitle className="text-lg font-semibold">Edit Sprint</DialogTitle></DialogHeader>
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                      <SprintForm projectId={id} milestoneId={milestoneId} sprint={sprint} onSuccess={() => { setIsEditOpen(false); fetchData(); }} />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {!loading && hasPermission('sprints.delete') && (
                <button onClick={() => confirm('Delete?') && deleteSprintAction(sprintId, id).then(() => router.back())} className="h-9 w-9 flex items-center justify-center rounded-md border border-slate-200 text-red-500 hover:bg-red-50 transition-all active:scale-95 bg-white cursor-pointer"><Trash2 className="h-4 w-4" /></button>
              )}
            </div>
          </div>
          <div className="text-sm text-slate-500 font-normal leading-relaxed max-w-lg mb-8">{sprint.description || "Active sprint phase focusing on task execution."}</div>
          <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-slate-100">
             {loading ? (
  <Button variant="secondary" className="h-10 w-32" disabled>
    <FileUp className="h-4 w-4" /> Upload
  </Button>
) : hasPermission('documents.create') ? (
  <ActionButton title="Upload" trigger={
    <Button variant="secondary" className="h-10 w-32 cursor-pointer">
      <FileUp className="h-4 w-4" /> Upload
    </Button>
  }>
 <DocumentForm projectId={id} ids={{ phase_id: phaseId, milestone_id: milestoneId, sprint_id: sprintId }} />
                </ActionButton>
                ) : null}
              {/* FIX: Updated URL to include hierarchy for the filters to work immediately */}
              <Link href={`/projects/${id}/documents?phaseId=${phaseId}&milestoneId=${milestoneId}&sprintId=${sprintId}`} className="flex items-center justify-center h-10 w-32 bg-[#006AFF] text-white rounded-md font-semibold text-xs gap-2 hover:bg-[#99C4FF] transition-all shadow-md active:scale-95 whitespace-nowrap cursor-pointer"><FolderOpen className="h-4 w-4" /> View Doc</Link>
          </div>
        </section>

        {/* Sprint Stats Section - Fixed spacing to fill column */}
        <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-start overflow-hidden h-full">
            <div className="flex items-center gap-2 mb-8 shrink-0">
                <Activity className="h-4 w-4 text-[#006AFF]" />
                <h3 className="text-xs font-bold tracking-widest uppercase text-slate-400">Sprint Stats</h3>
            </div>
            <div className="flex-1 flex flex-col justify-around min-h-[120px]">
                <div className="flex items-center justify-between text-xs py-2">
                    <span className="text-slate-400 font-medium uppercase tracking-wider">Starts</span>
                    <span className="font-semibold text-slate-900">{sprint.start_date || 'TBD'}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-2">
                    <span className="text-slate-400 font-medium uppercase tracking-wider">Ends</span>
                    <span className="font-semibold text-slate-900">{sprint.end_date || 'TBD'}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-100 mt-2">
                    <span className="text-slate-400 font-medium uppercase tracking-wider">Tasks</span>
                    <span className="font-semibold">{sprint.tasks?.length || 0} Units</span>
                </div>
            </div>
        </section>
      </div>
   

      <section className="space-y-6">
        <div className="flex justify-between items-center px-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#006AFF]" /> Task Backlog</h2>
            {!loading && hasPermission('tasks.create') && (
              <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
                <DialogTrigger asChild><Button className="cursor-pointer"><Plus className="h-4 w-4" /> New Task</Button></DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-[50vw] w-full max-h-[90vh] bg-white flex flex-col border-none shadow-2xl overflow-hidden rounded-[24px]">
                  <DialogHeader className="p-6 border-b"><DialogTitle className="text-lg font-semibold">Create Task</DialogTitle></DialogHeader>
                  <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                      <TaskForm ids={{ project_id: id, phase_id: phaseId, milestone_id: milestoneId, sprint_id: sprintId }} onSuccess={() => { setIsAddTaskOpen(false); fetchData(); }} />
                  </div>
                </DialogContent>
              </Dialog>
            )}
        </div>
        <div className="grid gap-3">
          {sprint.tasks?.map((task: any) => (
            <TaskItem key={task.id} task={task} ids={{ project_id: id, phase_id: phaseId, milestone_id: milestoneId, sprint_id: sprintId }} onRefresh={fetchData} />
          ))}
        </div>
      </section>

      <section className="mt-8 border-t border-slate-100 pt-10"><SprintThreads sprintId={sprintId} title="Discussions" /></section>
    </div>
  );
}