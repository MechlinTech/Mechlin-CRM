import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function PhasePage({ params }: { params: Promise<{ id: string, phaseId: string }> }) {
  const { id, phaseId } = await params;

  const { data: phase } = await supabase
    .from("phases")
    .select("*, milestones(*)")
    .eq("id", phaseId)
    .single();

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <nav className="flex text-xs text-zinc-400 gap-2 mb-4 uppercase font-bold tracking-tighter">
           <Link href={`/projects/${id}`} className="hover:text-black">Project</Link>
           <span>/</span>
           <span className="text-zinc-800">Phase Details</span>
        </nav>
        <h1 className="text-3xl font-extrabold">{phase.name}</h1>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase text-zinc-400">Milestones in this Phase</h2>
        <div className="grid gap-3">
          {phase.milestones?.map((m: any) => (
            <Link 
              key={m.id} 
              href={`/projects/${id}/phases/${phaseId}/milestones/${m.id}`}
              className="flex items-center justify-between p-5 rounded-xl border border-zinc-200 hover:border-black bg-white transition-all group shadow-sm"
            >
              <div className="space-y-1">
                <p className="font-bold text-zinc-800">{m.name}</p>
                <p className="text-xs text-zinc-400">{m.start_date} to {m.end_date}</p>
              </div>
              <div className="flex items-center gap-4">
                <Badge className="bg-zinc-100 text-zinc-600 border-none">{m.status}</Badge>
                <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-black" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}