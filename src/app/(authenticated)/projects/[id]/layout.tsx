import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { notFound } from "next/navigation";

export default async function ProjectLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode, 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  
  // Fetch Project and split members by is_internal flag 
  const { data: project, error } = await supabase
    .from("projects")
    .select(`
      *,
      organisations(name),
      project_members(
        users(id, name, organisations(name, is_internal))
      )
    `)
    .eq("id", id)
    .single();

  if (!project || error) notFound();

  const members = project.project_members || [];
  const mechlinTeam = members.filter((m: any) => m.users.organisations.is_internal);
  const orgTeam = members.filter((m: any) => !m.users.organisations.is_internal);

  return (
    <div className="flex min-h-screen bg-white text-black">
      {/* Main Content Area (Phase/Milestone/Sprint Info) [cite: 12] */}
      <div className="flex-1 p-8 overflow-y-auto border-r border-zinc-100">
        {children}
      </div>

      {/* Persistent Right Sidebar: Project Members [cite: 23, 61, 152] */}
      <aside className="w-80 p-6 space-y-8 bg-zinc-50/50">
        <div>
          <h3 className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mb-4">Mechlin Team</h3>
          <div className="space-y-3">
            {mechlinTeam.map((m: any) => (
              <div key={m.users.id} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
                  {m.users.name.charAt(0)}
                </div>
                <span className="text-sm font-medium">{m.users.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mb-4">Client Team ({project.organisations?.name})</h3>
          <div className="space-y-3">
            {orgTeam.map((m: any) => (
              <div key={m.users.id} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center text-xs font-bold">
                  {m.users.name.charAt(0)}
                </div>
                <span className="text-sm font-medium">{m.users.name}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}