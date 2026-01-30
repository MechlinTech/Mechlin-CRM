import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ProjectOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const { data: project } = await supabase
    .from("projects")
    .select("*, phases(*)")
    .eq("id", id)
    .single();

  return (
    <div className="max-w-4xl space-y-12">
      {/* Project Header [cite: 51, 111] */}
      <section>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">{project.name}</h1>
        <div className="grid grid-cols-3 gap-8 pt-6 border-t border-zinc-100">
          <div>
            <p className="text-[10px] font-bold uppercase text-zinc-400">Budget</p>
            <p className="text-lg font-semibold">{project.currency} {project.budget?.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-zinc-400">Timeline</p>
            <p className="text-lg font-semibold">{project.start_date} — {project.expected_end_date || 'Ongoing'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-zinc-400">Repo</p>
            <a href={project.repo_link} className="text-blue-600 text-sm truncate block hover:underline">
              {project.repo_link || 'No Repo Linked'}
            </a>
          </div>
        </div>
      </section>

      {/* Visual Hierarchy: Phases [cite: 15, 55, 116, 153] */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Project Phases</h2>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Plus className="h-3.5 w-3.5" /> Add Phase
          </Button>
        </div>
        
        <div className="grid gap-3">
          {project.phases?.map((phase: any) => (
            <Link 
              key={phase.id} 
              href={`/projects/${id}/phases/${phase.id}`}
              className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 hover:border-black transition-colors group bg-white shadow-sm"
            >
              <span className="font-medium">{phase.name}</span>
              <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-black" />
            </Link>
          ))}
        </div>
      </section> section for CRUD info and status logic [cite: 59, 118]
    </div>
  );
}