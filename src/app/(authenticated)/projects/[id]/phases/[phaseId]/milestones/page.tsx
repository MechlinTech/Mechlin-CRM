import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function MilestonePage({ params }: { params: Promise<{ id: string, milestoneId: string }> }) {
  const { id, milestoneId } = await params;

  const { data: milestone } = await supabase
    .from("milestones")
    .select("*, sprints(*)")
    .eq("id", milestoneId)
    .single();

  return (
    <div className="max-w-4xl space-y-10">
      <section>
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold">{milestone.name}</h1>
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none px-3">
            {milestone.status}
          </Badge>
        </div>

        {/* Milestone Fields  */}
        <div className="grid grid-cols-2 gap-y-8 p-6 bg-zinc-50 rounded-xl border border-zinc-100">
          <div><p className="text-[10px] font-bold uppercase text-zinc-400">Deliverables</p>
          <p className="text-sm mt-1">{milestone.deliverables || 'N/A'}</p></div>
          <div><p className="text-[10px] font-bold uppercase text-zinc-400">Demo Date</p>
          <p className="text-sm mt-1">{milestone.demo_date || 'Not set'}</p></div>
          <div><p className="text-[10px] font-bold uppercase text-zinc-400">Budget Allocated</p>
          <p className="text-sm mt-1 font-semibold">${milestone.budget?.toLocaleString()}</p></div>
          <div><p className="text-[10px] font-bold uppercase text-zinc-400">Estimated Hours</p>
          <p className="text-sm mt-1 font-semibold">{milestone.hours} hrs</p></div>
        </div>
      </section>

      {/* Sprints Section [cite: 19, 58, 154] */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Associated Sprints</h2>
        <div className="grid gap-3">
          {milestone.sprints?.map((sprint: any) => (
            <Link 
              key={sprint.id}
              href={`/projects/${id}/sprints/${sprint.id}`}
              className="p-4 rounded-lg border border-zinc-200 bg-white hover:shadow-md transition-shadow flex justify-between"
            >
              <div>
                <p className="font-bold text-sm">{sprint.name}</p>
                <p className="text-xs text-zinc-400">{sprint.start_date} - {sprint.end_date}</p>
              </div>
              <Badge variant="outline" className="text-[10px]">{sprint.status}</Badge>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}