import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function SprintPage({ params }: { params: Promise<{ id: string, phaseId: string, milestoneId: string, sprintId: string }> }) {
  const { id, phaseId, milestoneId, sprintId } = await params;

  const { data: sprint } = await supabase
    .from("sprints")
    .select("*")
    .eq("id", sprintId)
    .single();

  return (
    <div className="max-w-4xl space-y-10">
      <nav className="flex text-[10px] text-zinc-400 gap-2 mb-4 uppercase font-bold tracking-widest">
           <Link href={`/projects/${id}`} className="hover:text-black">Project</Link>
           <span>/</span>
           <Link href={`/projects/${id}/phases/${phaseId}/milestones/${milestoneId}`} className="hover:text-black">Milestone</Link>
           <span>/</span>
           <span className="text-zinc-800">Sprint View</span>
      </nav>

      <section>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter">{sprint.name}</h1>
          <Badge className="bg-blue-50 text-blue-700 border-blue-100 px-4 py-1">
            {sprint.status || 'Active'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-6 p-8 border border-zinc-200 rounded-2xl bg-white shadow-sm">
          <div>
            <p className="text-[10px] font-bold uppercase text-zinc-400 mb-2">Description</p>
            <p className="text-zinc-700 leading-relaxed">
              {sprint.description || "No specific details provided for this sprint cycle."}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-zinc-50">
            <div>
              <p className="text-[10px] font-bold uppercase text-zinc-400">Duration</p>
              <p className="text-sm font-semibold mt-1">{sprint.start_date} — {sprint.end_date}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}