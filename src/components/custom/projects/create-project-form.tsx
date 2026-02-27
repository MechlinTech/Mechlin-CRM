  "use client"

  import * as React from "react"
  import { useForm } from "react-hook-form"
  import { zodResolver } from "@hookform/resolvers/zod"
  import * as z from "zod"
  import { Button } from "@/components/ui/button"
  import { Form, FormControl, FormField, FormItem, FormLabel , FormMessage } from "@/components/ui/form"
  import { Input } from "@/components/ui/input"
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
  import { Checkbox } from "@/components/ui/checkbox"
  import { toast } from "sonner"
  import { useRouter } from "next/navigation"
  import { createProjectAction, updateProjectAction, getAllActiveUsersWithOrgsAction } from "@/actions/projects"
  import { cn } from "@/lib/utils"
  import { useRBAC } from "@/context/rbac-context" // Added RBAC Integration


const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  organisation_id: z.string().uuid("Please select an organization"),
status: z.enum(["Active", "Pending", "Suspended"]),
  repo_link: z.string().url("Must be a valid URL").or(z.literal("")).nullable(),
  start_date: z.string().min(1, "Start date is required"),
  expected_end_date: z.string().optional().nullable(),
  budget: z.coerce.number().min(0, "Budget must be a positive number").optional().nullable(),
  currency: z.string().min(1, "Currency is required").default("USD"),
  members: z.array(z.string()).min(1, "Assign at least one member"),
})

  export function CreateProjectForm({ onSuccess, project, organisations }: any) {
    const [loading, setLoading] = React.useState(false)
    const [mounted, setMounted] = React.useState(false)
    const [allUsers, setAllUsers] = React.useState<any[]>([])
    const router = useRouter()
    const isEditMode = !!project
    const { hasPermission } = useRBAC(); // Added RBAC Hook

    const clientOrgs = React.useMemo(() => 
      (organisations ?? []).filter((org: any) => 
        org.is_internal !== true && 
        org.name?.trim().toLowerCase() !== "mechlin"
      ),
      [organisations]
    );

    const form = useForm({
      resolver: zodResolver(projectSchema),
      defaultValues: project ? {
          ...project,
          repo_link: project.repo_link ?? "",
          expected_end_date: project.expected_end_date ?? "",
          budget: project.budget ?? 0,
          members: project.project_members?.map((m: any) => m.user_id) || []
      } : {
        name: "", organisation_id: "", status: "Pending", repo_link: "",
        start_date: new Date().toISOString().split('T')[0], expected_end_date: "",
        budget: 0, currency: "USD", members: [],
      },
    })

    const selectedOrgId = form.watch("organisation_id");

    React.useEffect(() => {
      setMounted(true);
      async function loadData() {
        const res = await getAllActiveUsersWithOrgsAction();
        if (res.success) setAllUsers(res.data ?? []);
      }
      loadData();
    }, []);

    const mechlinTeam = allUsers.filter(u => 
      u.organisations?.is_internal === true || 
      u.organisations?.name?.trim().toLowerCase() === "mechlin"
    );
    
    const clientTeam = allUsers.filter(u => 
      u.organisation_id === selectedOrgId && 
      u.organisations?.is_internal !== true &&
      u.organisations?.name?.trim().toLowerCase() !== "mechlin"
    );

    if (!mounted) return null;

    async function onSubmit(values: z.infer<typeof projectSchema>) {
      // RBAC: Double check permissions before calling server actions
      if (isEditMode && !hasPermission('projects.update')) {
          toast.error("You don't have permission to update projects");
          return;
      }
      if (!isEditMode && !hasPermission('projects.create')) {
          toast.error("You don't have permission to create projects");
          return;
      }

      setLoading(true);
      const result = isEditMode 
          ? await updateProjectAction(project.id, values) 
          : await createProjectAction(values);

      if (result.success) {
        toast.success("Project saved");
        router.refresh();
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
      setLoading(false);
    }

    const renderSelectionBox = (users: any[], label: string) => (
      <div className="flex flex-col gap-2">
        <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">{label}</FormLabel>
        <div className="border border-slate-200 rounded-xl p-3 h-[180px] overflow-y-auto bg-slate-50/30 transition-all focus-within:bg-white focus-within:border-[#006AFF]/30 scrollbar-hide">
          {users.length > 0 ? users.map((u) => (
            <FormField key={u.id} control={form.control} name="members" render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 py-1.5 space-y-0 group">
                <FormControl>
                  <Checkbox 
                    className="h-4 w-4 border-slate-300 data-[state=checked]:bg-[#006AFF] data-[state=checked]:border-[#006AFF] cursor-pointer" 
                    checked={field.value?.includes(u.id)} 
                    onCheckedChange={(checked) => {
                      return checked 
                        ? field.onChange([...field.value, u.id]) 
                        : field.onChange(field.value?.filter((v: string) => v !== u.id))
                    }} 
                  />
                </FormControl>
                <span className="text-xs font-medium text-slate-700 cursor-pointer group-hover:text-[#006AFF] transition-colors">{u.name}</span>
              </FormItem>
            )} />
          )) : <p className="text-[10px] text-slate-400 font-medium italic text-center py-4">No users available</p>}
        </div>
      </div>
    );

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-white text-[#0F172A] p-1 font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <FormField
    control={form.control}
    name="name"
    render={({ field }) => (
      <FormItem>
        <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Project Name</FormLabel>
        <FormControl>
          <Input 
            {...field} 
            className={cn(
              "bg-white border-slate-200 rounded-xl text-xs font-medium h-10 focus:border-[#006AFF]",
              form.formState.errors.name && "border-red-500 focus:border-red-500"
            )}
          />
        </FormControl>
        <FormMessage className="text-[10px] text-red-500 font-medium" />
      </FormItem>
    )}
  />

  {/* Organization Select */}
  <FormField
    control={form.control}
    name="organisation_id"
    render={({ field }) => (
      <FormItem>
        <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Organization</FormLabel>
        <Select onValueChange={field.onChange} value={field.value ?? ""}>
          <FormControl>
            <SelectTrigger className={cn(
              "bg-white border-slate-200 rounded-xl text-xs font-medium h-10",
              form.formState.errors.organisation_id && "border-red-500"
            )}>
              <SelectValue placeholder="Select Organization" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {clientOrgs.map((org: any) => (
              <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage className="text-[10px] text-red-500 font-medium" />
      </FormItem>
    )}
  />
</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="flex flex-col gap-2">
        {renderSelectionBox(mechlinTeam, "Mechlin Team Members")}
        {/* Render error for the members array specifically here */}
     {form.formState.errors.members && (
  <p className="text-[10px] text-red-500 font-medium mt-1">
    {/* Use Type Assertion or check for string explicitly */}
    {String(form.formState.errors.members.message || "Assign at least one member")}
  </p>
)}
    </div>
    {renderSelectionBox(clientTeam, "Client Side Users")}
</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="start_date" render={({ field }) => (
              <FormItem>
                  <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Start Date</FormLabel>
                  <FormControl><Input type="date" className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10 cursor-pointer" {...field} value={field.value ?? ""} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="expected_end_date" render={({ field }) => (
              <FormItem>
                  <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Expected End Date</FormLabel>
                  <FormControl><Input type="date" className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10 cursor-pointer" {...field} value={field.value ?? ""} /></FormControl>
              </FormItem>
            )} />
          </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <FormField control={form.control} name="budget" render={({ field }) => (
    <FormItem>
        <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Budget</FormLabel>
        <FormControl><Input type="number" className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10" {...field} value={field.value ?? 0} /></FormControl>
    </FormItem>
  )} />
      <FormField control={form.control} name="currency" render={({ field }) => (
    <FormItem>
        <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Currency</FormLabel>
        <Select onValueChange={field.onChange} value={field.value ?? "USD"}>
            <FormControl>
                <SelectTrigger className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10 cursor-pointer">
                    <SelectValue />
                </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-white border-slate-200 rounded-xl shadow-2xl">
                <SelectItem value="USD" className="text-xs font-medium cursor-pointer">USD</SelectItem>
                <SelectItem value="EUR" className="text-xs font-medium cursor-pointer">EUR</SelectItem>
                <SelectItem value="GBP" className="text-xs font-medium cursor-pointer">GBP</SelectItem>
                <SelectItem value="INR" className="text-xs font-medium cursor-pointer">INR</SelectItem>
            </SelectContent>
        </Select>
    </FormItem>
  )} />

  <FormField control={form.control} name="status" render={({ field }) => (
    <FormItem>
        <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Status</FormLabel>
        <Select onValueChange={field.onChange} value={field.value ?? ""}>
            <FormControl>
                <SelectTrigger className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10 cursor-pointer">
                    <SelectValue />
                </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-white border-slate-200 rounded-xl shadow-2xl">
                <SelectItem value="Active" className="text-xs font-medium cursor-pointer">Active</SelectItem>
                <SelectItem value="Pending" className="text-xs font-medium cursor-pointer">Pending</SelectItem>
                <SelectItem value="Suspended" className="text-xs font-medium cursor-pointer">Suspended</SelectItem>
            </SelectContent>
        </Select>
    </FormItem>
  )} />
</div>

          <FormField control={form.control} name="repo_link" render={({ field }) => (
            <FormItem>
                <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Repo Link</FormLabel>
                <FormControl><Input placeholder="https://..." className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10 focus:border-[#006AFF] transition-all" {...field} value={field.value ?? ""} /></FormControl>
            </FormItem>
          )} />

          <Button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-[#006AFF] text-white font-semibold h-12 rounded-xl shadow-lg hover:bg-[#99C4FF] transition-all active:scale-95 cursor-pointer mt-2"
          >
            {loading ? "Saving..." : (isEditMode ? "Update Project" : "Create Project & Assign Members")}
          </Button>
        </form>
      </Form>
    )
  }