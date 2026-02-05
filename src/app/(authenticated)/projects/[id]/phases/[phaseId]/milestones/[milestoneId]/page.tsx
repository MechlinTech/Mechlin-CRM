"use client"

import * as React from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SprintForm } from "@/components/custom/projects/sprint-form";
import { MilestoneForm } from "@/components/custom/projects/milestone-form";
import { deleteMilestoneAction, deleteSprintAction } from "@/actions/hierarchy";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { MilestoneThreads } from "@/components/custom/threads";

export default function MilestonePage({ params }: { params: any }) {
  const router = useRouter();
  const { id, phaseId, milestoneId } = React.use(params) as any;
  const [m, setMilestone] = React.useState<any>(null);
  const [isSprintOpen, setIsSprintOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editingSprint, setEditingSprint] = React.useState<any>(null);

  const fetchData = React.useCallback(async () => {
    const { data } = await supabase.from("milestones").select("*, sprints(*)").eq("id", milestoneId).single();
    setMilestone(data);
  }, [milestoneId]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  if (!m) return null;

  return (
    <div className="max-w-5xl space-y-10 text-black font-sans">
      <nav className="flex text-[10px] text-zinc-400 gap-2 mb-4 uppercase font-bold tracking-widest">
        <Link href={`/projects/${id}`} className="hover:text-black">Project</Link>
        <span>/</span>
        <Link href={`/projects/${id}/phases/${phaseId}`} className="hover:text-black">Phase</Link>
        <span>/</span>
        <span className="text-zinc-800">Milestone View</span>
      </nav>

      <section className="space-y-8 p-10 bg-white border border-zinc-200 rounded-3xl shadow-sm">
        <div className="flex justify-between items-start border-b border-zinc-100 pb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-2">{m.name}</h1>
            <p className="text-[10px] font-bold uppercase px-3 py-1 bg-zinc-900 text-white inline-block rounded-md">{m.status}</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full gap-2 border-zinc-300 uppercase text-[9px] font-bold">
                  <Pencil className="h-3 w-3" /> Edit Milestone
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white text-black border-zinc-200 shadow-2xl">
                <DialogHeader><DialogTitle>Edit Milestone Details</DialogTitle></DialogHeader>
                <MilestoneForm projectId={id} phaseId={phaseId} milestone={m} onSuccess={() => { setIsEditOpen(false); fetchData(); }} />
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" onClick={async () => { await deleteMilestoneAction(milestoneId, id); router.push(`/projects/${id}`); }} className="rounded-full border-red-200 text-red-600 hover:bg-red-50 uppercase text-[9px] font-bold gap-2">
              <Trash2 className="h-3 w-3" /> Delete
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-y-10 text-sm">
          <div><p className="text-[9px] font-bold uppercase text-zinc-400">Deliverables</p><p className="mt-1 font-medium">{m.deliverables || "None"}</p></div>
          <div><p className="text-[9px] font-bold uppercase text-zinc-400">Demo Date</p><p className="mt-1 font-bold text-orange-600">{m.demo_date || "Pending"}</p></div>
          <div><p className="text-[9px] font-bold uppercase text-zinc-400">Hours/Budget</p><p className="mt-1 font-bold">{m.hours} Hrs — ${m.budget?.toLocaleString()}</p></div>
          <div><p className="text-[9px] font-bold uppercase text-zinc-400">Timeline</p><p className="mt-1 font-bold">{m.start_date} to {m.end_date}</p></div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-xl font-black tracking-tight">Milestone Sprints</h2>
          <Dialog open={isSprintOpen} onOpenChange={(val) => { if(!val) setEditingSprint(null); setIsSprintOpen(val); }}>
            <DialogTrigger asChild>
              <Button className="h-8 px-5 bg-black text-white rounded-full text-[10px] font-bold uppercase gap-2">
                <Plus className="h-3 w-3" /> Add Sprint
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white text-black border-zinc-200 shadow-2xl">
              <DialogHeader><DialogTitle>{editingSprint ? "Edit Sprint" : "Add New Sprint"}</DialogTitle></DialogHeader>
              <SprintForm 
                milestoneId={milestoneId} 
                projectId={id} 
                sprint={editingSprint}
                onSuccess={() => { setIsSprintOpen(false); setEditingSprint(null); fetchData(); }} 
              />
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid gap-3">
          {m.sprints?.map((sprint: any) => (
            <div key={sprint.id} className="p-5 bg-zinc-50/50 border border-zinc-200 rounded-2xl flex items-center justify-between hover:border-black transition-all group">
              <Link href={`/projects/${id}/phases/${phaseId}/milestones/${milestoneId}/sprints/${sprint.id}`} className="flex-1">
                <p className="font-bold text-sm mb-1">{sprint.name}</p>
                <p className="text-[10px] text-zinc-400 truncate max-w-md">{sprint.description || "No description provided"}</p>
              </Link>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-[10px] uppercase">{sprint.status || 'Active'}</Badge>
                <button onClick={() => { setEditingSprint(sprint); setIsSprintOpen(true); }} className="text-zinc-300 hover:text-black transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={async () => { await deleteSprintAction(sprint.id, id); fetchData(); }} className="text-zinc-300 hover:text-red-600 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
                <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-black" />
              </div>
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