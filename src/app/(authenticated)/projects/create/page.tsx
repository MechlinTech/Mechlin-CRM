import { supabase } from "@/lib/supabase";
import { CreateProjectForm } from "@/components/custom/projects/create-project-form";

export default async function CreateProjectPage() {
    // Fetch organizations for the dropdown [cite: 44, 103]
    const { data: organizations } = await supabase
        .from("organisations")
        .select("id, name");

    return (
        <div className="max-w-3xl mx-auto py-10 space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Project Setup</h1>
                <p className="text-muted-foreground">Configure the core details for your new project.</p>
            </div>
            
            {/* Using the custom form you previously created */}
            <CreateProjectForm organizations={organizations || []} />
        </div>
    );
}