"use client"

import * as React from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SprintForm } from "@/components/custom/projects/sprint-form";

export default function SprintPage({ params }: { params: any }) {
  const { id, phaseId, milestoneId, sprintId } = React.use(params) as any;
  const [sprint, setSprint] = React.useState<any>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    const { data } = await supabase.from("sprints").select("*").eq("id", sprintId).single();
    setSprint(data);
  }, [sprintId]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  if (!sprint) return null;

  return (
    <div className="max-w-4xl space-y-10 text-black">
      <nav className="flex text-[10px] text-zinc-400 gap-2 mb-4 uppercase font-bold tracking-widest">
          <Link href={`/projects/${id}`} className="hover:text-black">Project</Link>
          <span>/</span>
          <Link href={`/projects/${id}/phases/${phaseId}/milestones/${milestoneId}`} className="hover:text-black">Milestone</Link>
          <span>/</span>
          <span className="text-zinc-800">Sprint View</span>
      </nav>

      <section>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-2">{sprint.name}</h1>
            <Badge className="bg-blue-50 text-blue-700 border-blue-100 px-4 py-1 uppercase text-[10px] font-bold">
              {sprint.status || 'Active'}
            </Badge>
          </div>
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full gap-2 border-zinc-300 uppercase text-[9px] font-bold h-9 px-5">
                <Pencil className="h-3 w-3" /> Edit Sprint
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white text-black border-zinc-200 shadow-2xl">
              <DialogHeader><DialogTitle>Edit Sprint Details</DialogTitle></DialogHeader>
              <SprintForm projectId={id} milestoneId={milestoneId} sprint={sprint} onSuccess={() => { setIsEditOpen(false); fetchData(); }} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-6 p-8 border border-zinc-200 rounded-3xl bg-white shadow-sm">
          <div>
            <p className="text-[10px] font-bold uppercase text-zinc-400 mb-2 tracking-widest">Description</p>
            <p className="text-zinc-700 leading-relaxed font-medium">
              {sprint.description || "No specific details provided for this sprint cycle."}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-zinc-50">
            <div>
              <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Sprint Duration</p>
              <p className="text-sm font-bold mt-1 text-zinc-900">{sprint.start_date} — {sprint.end_date}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}