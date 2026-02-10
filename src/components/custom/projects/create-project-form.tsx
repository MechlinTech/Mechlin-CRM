"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createProjectAction, updateProjectAction, getAllActiveUsersWithOrgsAction } from "@/actions/projects"

const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  organisation_id: z.string().uuid("Please select an organization"),
  status: z.enum(["Active", "Pending", "Suspended"]),
  repo_link: z.string().optional().nullable(),
  start_date: z.string().min(1, "Start date is required"),
  expected_end_date: z.string().optional().nullable(),
  budget: z.coerce.number().optional().nullable(),
  currency: z.string().default("USD"),
  members: z.array(z.string()).min(1, "Assign at least one member"),
})

export function CreateProjectForm({ onSuccess, project, organisations }: any) {
  const [loading, setLoading] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const [allUsers, setAllUsers] = React.useState<any[]>([])
  const router = useRouter()
  const isEditMode = !!project

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
      <FormLabel className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">{label}</FormLabel>
      {/* Scrollable container with fixed height */}
      <div className="border border-zinc-200 rounded-md p-3 h-[180px] overflow-y-auto bg-white shadow-inner scrollbar-thin">
        {users.length > 0 ? users.map((u) => (
          <FormField key={u.id} control={form.control} name="members" render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-2 py-1 space-y-0">
              <FormControl>
                <Checkbox 
                  className="h-4 w-4 border-zinc-300 data-[state=checked]:bg-black" 
                  checked={field.value?.includes(u.id)} 
                  onCheckedChange={(checked) => {
                    return checked 
                      ? field.onChange([...field.value, u.id]) 
                      : field.onChange(field.value?.filter((v: string) => v !== u.id))
                  }} 
                />
              </FormControl>
              <span className="text-xs text-zinc-700 cursor-pointer">{u.name}</span>
            </FormItem>
          )} />
        )) : <p className="text-[10px] text-zinc-300 italic text-center py-4">No users available</p>}
      </div>
    </div>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-white text-black p-1">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Project Name</FormLabel><Input className="bg-white border-zinc-200" {...field} value={field.value ?? ""} /></FormItem>
          )} />
          <FormField control={form.control} name="organisation_id" render={({ field }) => (
            <FormItem><FormLabel>Organization</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                <SelectTrigger className="bg-white border-zinc-200"><SelectValue placeholder="Select Client" /></SelectTrigger>
                <SelectContent className="bg-white max-h-[200px] overflow-y-auto">
                  {clientOrgs.map((org: any) => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select></FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {renderSelectionBox(mechlinTeam, "Mechlin Team Members")}
          {renderSelectionBox(clientTeam, "Client Side Users")}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="start_date" render={({ field }) => (
            <FormItem><FormLabel>Start Date</FormLabel><Input type="date" className="bg-white border-zinc-200" {...field} value={field.value ?? ""} /></FormItem>
          )} />
          <FormField control={form.control} name="expected_end_date" render={({ field }) => (
            <FormItem><FormLabel>Expected End Date</FormLabel><Input type="date" className="bg-white border-zinc-200" {...field} value={field.value ?? ""} /></FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-black">
          <FormField control={form.control} name="budget" render={({ field }) => (
            <FormItem><FormLabel>Budget</FormLabel><Input type="number" className="bg-white border-zinc-200" {...field} value={field.value ?? 0} /></FormItem>
          )} />
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem><FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                <SelectTrigger className="bg-white border-zinc-200"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select></FormItem>
          )} />
        </div>

        <FormField control={form.control} name="repo_link" render={({ field }) => (
          <FormItem><FormLabel>Repo Link</FormLabel><Input placeholder="https://..." className="bg-white border-zinc-200" {...field} value={field.value ?? ""} /></FormItem>
        )} />

        <Button type="submit" disabled={loading} className="w-full bg-black text-white hover:bg-zinc-800 font-bold mt-2">
          {loading ? "Saving..." : (isEditMode ? "Update Project" : "Create Project & Assign Members")}
        </Button>
      </form>
    </Form>
  )
}