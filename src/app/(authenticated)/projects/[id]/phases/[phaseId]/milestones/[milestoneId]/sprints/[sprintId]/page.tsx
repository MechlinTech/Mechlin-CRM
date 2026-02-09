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
import { SprintThreads } from "@/components/custom/threads/SprintThreads";

export default function SprintPage({ params }: { params: any }) {
  const { id, phaseId, milestoneId, sprintId } = React.use(params) as any;
  const [sprint, setSprint] = React.useState<any>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    const { data } = await supabase.from("sprints").select("*, tasks(*)").eq("id", sprintId).single();
    if (data?.tasks) data.tasks.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setSprint(data);
  }, [sprintId]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  if (!sprint) return null;

  return (
    <div className="max-w-4xl space-y-10 text-black font-sans relative">
      
      <section className="p-10 border border-zinc-200 rounded-[32px] bg-zinc-50/30 shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center gap-3">
                <h1 className="text-5xl font-black tracking-tighter">{sprint.name}</h1>
                <Badge className="bg-zinc-900 text-white px-3 py-0.5 uppercase text-[9px] font-black tracking-widest rounded-full shadow-md">
                    {sprint.status || 'Active'}
                </Badge>
            </div>
            
            <div className="flex gap-2 items-start text-zinc-500">
                <AlignLeft className="h-4 w-4 mt-1 shrink-0" />
                <p className="text-xs leading-relaxed font-medium">
                    {sprint.description || "No description provided."}
                </p>
            </div>
          </div>

          <div className="flex gap-2">
            <ActionButton title="Upload Doc" trigger={<Button variant="outline" size="sm" className="rounded-full gap-2 border-zinc-300 font-bold uppercase text-[9px] h-9 px-4"><FileUp className="h-3.5 w-3.5" /> Upload</Button>}>
                <DocumentForm projectId={id} ids={{ phase_id: phaseId, milestone_id: milestoneId, sprint_id: sprintId }} />
            </ActionButton>
            
            <Link href={`/projects/${id}/documents?sprintId=${sprintId}`} className="flex items-center h-9 px-4 bg-black text-white rounded-full font-black uppercase text-[9px] gap-2 shadow-md hover:bg-zinc-800 transition-all">
                <FolderOpen className="h-3.5 w-3.5" /> Vault
            </Link>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild><Button variant="outline" size="sm" className="rounded-full gap-2 border-zinc-300 uppercase text-[9px] font-bold h-9 px-4 shadow-sm"><Pencil className="h-3.5 w-3.5" /> Edit</Button></DialogTrigger>
              <DialogContent className="bg-white text-black border-zinc-200 shadow-2xl"><DialogHeader><DialogTitle className="font-black uppercase text-lg">Modify Sprint</DialogTitle></DialogHeader>
                <SprintForm projectId={id} milestoneId={milestoneId} sprint={sprint} onSuccess={() => { setIsEditOpen(false); fetchData(); }} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex justify-between items-center px-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Task Backlog
            </h2>
            <ActionButton title="Create Task" trigger={<Button className="rounded-full bg-black text-white h-10 px-8 font-black uppercase text-[9px] gap-2 shadow-xl hover:bg-zinc-800 transition-all"><Plus className="h-4 w-4" /> New Task</Button>}>
                <TaskForm ids={{ project_id: id, phase_id: phaseId, milestone_id: milestoneId, sprint_id: sprintId }} onSuccess={fetchData} />
            </ActionButton>
        </div>
        <div className="grid gap-4">
          {sprint.tasks?.map((task: any) => (
            <div key={task.id} className="p-8 bg-white border border-zinc-100 rounded-[32px] flex items-center justify-between hover:border-black transition-all shadow-sm">
                <div className="space-y-2">
                    <p className="font-black text-lg tracking-tight text-zinc-900 uppercase">{task.title}</p>
                    <div className="text-[11px] text-zinc-500 font-medium leading-relaxed max-w-lg prose-xs" dangerouslySetInnerHTML={{ __html: task.description || "No details." }} />
                </div>
                <div className="flex items-center gap-2">
                    <ActionButton title="Edit Task" trigger={<button className="h-10 w-10 flex items-center justify-center rounded-2xl border border-zinc-100 text-zinc-300 hover:text-black transition-all shadow-sm"><Pencil className="h-4 w-4" /></button>}>
                        <TaskForm task={task} ids={{ project_id: id, phase_id: phaseId, milestone_id: milestoneId, sprint_id: sprintId }} onSuccess={fetchData} />
                    </ActionButton>
                    <button onClick={async () => { await deleteTaskAction(task.id, id); fetchData(); toast.success("Deleted"); }} className="h-10 w-10 flex items-center justify-center rounded-2xl border border-zinc-100 text-zinc-300 hover:text-red-600 transition-all shadow-sm"><Trash2 className="h-4 w-4" /></button>
                </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 border-t border-zinc-100 pt-10">
        <SprintThreads sprintId={sprintId} title="Sprint Discussions" />
      </section>
    </div>
  );
}