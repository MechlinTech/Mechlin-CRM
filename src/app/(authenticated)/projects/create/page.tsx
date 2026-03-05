import { supabase } from "@/lib/supabase";
import { CreateProjectForm } from "@/components/custom/projects/create-project-form";
import { getServerUserPermissions } from "@/lib/rbac-middleware"; // RBAC Server Utility
import { redirect } from "next/navigation";

export default async function CreateProjectPage() {
    // 1. RBAC CHECK: Verify permission on the server side
    const permissions = await getServerUserPermissions();
    const canCreate = permissions.includes('projects.create');

    // 2. RESTRICTION: If user lacks 'projects.create', prevent access
    if (!canCreate) {
        redirect('/unauthorized');
    }

    // 3. DATA FETCHING: Logic remains exactly as you provided
    const { data: organizations } = await supabase
        .from("organisations")
        .select("id, name");

    // 4. UI: Remains 100% exactly as you setup
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