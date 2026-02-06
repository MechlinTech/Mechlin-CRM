"use client"

import * as React from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Pencil, Plus, Trash2, CheckCircle2, FileUp, FolderOpen, AlignLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SprintForm } from "@/components/custom/projects/sprint-form";
import { ActionButton } from "@/components/shared/action-button";
import { TaskForm } from "@/components/custom/projects/task-form";
import { DocumentForm } from "@/components/custom/projects/document-form";
import { deleteTaskAction } from "@/actions/hierarchy";
import { toast } from "sonner";

export default function SprintPage({ params }: { params: any }) {
  const { id, phaseId, milestoneId, sprintId } = React.use(params) as any;
  const [sprint, setSprint] = React.useState<any>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    const { data } = await supabase.from("sprints").select("*, tasks(*)").eq("id", sprintId).single();
    if (data?.tasks) {
        data.tasks.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    setSprint(data);
  }, [sprintId]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  if (!sprint) return null;

  return (
    <div className="max-w-4xl space-y-10 text-black font-sans relative">
      {/* FLOATING ACTION BUTTONS */}
      <div className="absolute -right-4 top-0 translate-x-full space-y-3 hidden xl:block">
          <ActionButton title="Upload Sprint Deliverable" trigger={
              <button className="flex flex-col items-center justify-center h-20 w-20 bg-zinc-900 text-white rounded-3xl shadow-2xl hover:scale-105 transition-all">
                  <FileUp className="h-6 w-6 mb-1" />
                  <span className="text-[8px] font-black uppercase tracking-tighter">Upload</span>
              </button>
          }>
              <DocumentForm projectId={id} ids={{ phase_id: phaseId, milestone_id: milestoneId, sprint_id: sprintId }} />
          </ActionButton>
          <Link href={`/projects/${id}/documents?sprintId=${sprintId}`} className="flex flex-col items-center justify-center h-20 w-20 bg-white border border-zinc-200 text-black rounded-3xl shadow-xl hover:scale-105 transition-all">
              <FolderOpen className="h-6 w-6 mb-1" />
              <span className="text-[8px] font-black uppercase tracking-tighter">Vault</span>
          </Link>
      </div>

      <section className="flex justify-between items-end border-b border-zinc-100 pb-10">
        <div className="space-y-4 max-w-xl">
          <h1 className="text-5xl font-black tracking-tighter">{sprint.name}</h1>
          
          <div className="flex gap-2 items-start text-zinc-500">
            <AlignLeft className="h-4 w-4 mt-1 shrink-0" />
            <p className="text-sm leading-relaxed">
                {sprint.description || "No description provided for this sprint."}
            </p>
          </div>

          <div className="flex gap-4 items-center">
            <Badge className="bg-zinc-900 text-white px-6 py-1.5 uppercase text-[10px] font-black tracking-widest rounded-full shadow-md">{sprint.status || 'Active'}</Badge>
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild><button className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-black transition-colors"><Pencil className="h-4 w-4" /></button></DialogTrigger>
              <DialogContent className="bg-white text-black border-zinc-200 shadow-2xl"><DialogHeader><DialogTitle className="font-black uppercase text-xl">Modify Sprint</DialogTitle></DialogHeader>
                <SprintForm projectId={id} milestoneId={milestoneId} sprint={sprint} onSuccess={() => { setIsEditOpen(false); fetchData(); }} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <ActionButton title="Create Sprint Task" trigger={<Button className="rounded-full bg-black text-white h-12 px-10 font-black uppercase text-[10px] gap-2 shadow-xl hover:bg-zinc-800 transition-all tracking-widest"><Plus className="h-4 w-4" /> New Task</Button>}>
          <TaskForm ids={{ project_id: id, phase_id: phaseId, milestone_id: milestoneId, sprint_id: sprintId }} onSuccess={fetchData} />
        </ActionButton>
      </section>

      <section className="space-y-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2 px-2"><CheckCircle2 className="h-4 w-4" /> Task Backlog</h2>
        <div className="grid gap-4">
          {sprint.tasks?.map((task: any) => (
            <div key={task.id} className="p-8 bg-white border border-zinc-100 rounded-[32px] flex items-center justify-between hover:border-black transition-all shadow-sm">
                <div className="space-y-2">
                    <p className="font-black text-xl tracking-tight text-zinc-900 uppercase">{task.title}</p>
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-lg">
                        {task.description || "No task details provided."}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* TASK EDIT BUTTON */}
                    <ActionButton title="Edit Task" trigger={
                        <button className="h-12 w-12 flex items-center justify-center rounded-2xl border border-zinc-100 text-zinc-300 hover:text-black transition-all shadow-sm">
                            <Pencil className="h-5 w-5" />
                        </button>
                    }>
                        <TaskForm 
                            task={task} 
                            ids={{ project_id: id, phase_id: phaseId, milestone_id: milestoneId, sprint_id: sprintId }} 
                            onSuccess={fetchData} 
                        />
                    </ActionButton>

                    <button onClick={async () => { await deleteTaskAction(task.id, id); fetchData(); toast.success("Task deleted"); }} className="h-12 w-12 flex items-center justify-center rounded-2xl border border-zinc-100 text-zinc-300 hover:text-red-600 transition-all shadow-sm">
                        <Trash2 className="h-5 w-5" />
                    </button>
                </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <SprintThreads 
          sprintId={sprintId}
          title="Sprint Discussions"
        />
      </section>
    </div>
  );
}