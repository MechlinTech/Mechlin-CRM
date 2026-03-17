"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createSprintAction, updateSprintAction } from "@/actions/hierarchy"
import { toast } from "sonner"

const sprintSchema = z.object({
  name: z.string().trim().min(1, "Sprint name is required"),
  description: z.string().optional().or(z.literal("")),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  status: z.string().min(1, "Status is required"),
}).refine((data) => {
  if (!data.start_date || !data.end_date) return true;
  return new Date(data.end_date) >= new Date(data.start_date);
}, {
  message: "End Date cannot be earlier than Start Date",
  path: ["end_date"],
});

type SprintFormValues = z.infer<typeof sprintSchema>

export function SprintForm({ milestoneId, projectId, sprint, onSuccess }: any) {
  const isEdit = !!sprint
  
  const form = useForm<SprintFormValues>({
    resolver: zodResolver(sprintSchema),
    defaultValues: {
      name: sprint?.name || "",
      description: sprint?.description || "",
      start_date: sprint?.start_date || "",
      end_date: sprint?.end_date || "",
      status: sprint?.status || "Active"
    }
  })

  async function onSubmit(values: SprintFormValues) {
    try {
      const res = isEdit 
        ? await updateSprintAction(sprint.id, projectId, values)
        : await createSprintAction(milestoneId, projectId, values);

      if (res.success) {
        toast.success(isEdit ? "Sprint Updated" : "Sprint Created");
        if (onSuccess) onSuccess(); 
      } else {
        toast.error(res.error || "Failed to save sprint");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  }

  return (
    <Form {...form}>
      {/* Removed flex-col and max-height from the form itself to prevent stretching */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="font-sans text-[#0F172A]">
        
        {/* The scrollable area handles the zoom protection without forcing height */}
        <div className="max-h-[60vh] overflow-y-auto px-1 pr-2 space-y-5 pt-2 custom-scrollbar">
          
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">
                Sprint Name <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  rows={1}
                  className="bg-white border-slate-200 rounded-xl text-xs font-medium min-h-[40px] focus:border-[#006AFF] transition-all w-full max-w-full break-all whitespace-pre-wrap py-2" 
                />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )} />

          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Description</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  className="bg-white border-slate-200 rounded-xl text-xs font-medium min-h-[100px] resize-none focus:border-[#006AFF] transition-all w-full max-w-full break-all whitespace-pre-wrap" 
                />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="start_date" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">
                  Start Date <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="date" {...field} className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10 cursor-pointer focus:border-[#006AFF] transition-all" />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />
            <FormField control={form.control} name="end_date" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">
                  End Date <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="date" {...field} className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10 cursor-pointer focus:border-[#006AFF] transition-all" />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">
                Status <span className="text-red-500">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10 cursor-pointer focus:border-[#006AFF] transition-all">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white border-slate-200 rounded-xl shadow-2xl">
                  <SelectItem value="Active" className="text-xs font-medium cursor-pointer">Active</SelectItem>
                  <SelectItem value="Completed" className="text-xs font-medium cursor-pointer">Completed</SelectItem>
                  <SelectItem value="Delayed" className="text-xs font-medium cursor-pointer">Delayed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )} />
        </div>

        {/* This button will now sit naturally below the fields with a small padding */}
        <div className="pt-6">
          <Button 
            type="submit" 
            disabled={form.formState.isSubmitting}
            className="w-full bg-[#006AFF] text-white font-semibold h-12 rounded-xl shadow-lg hover:bg-[#1a7bff] transition-all active:scale-95 cursor-pointer"
          >
            {form.formState.isSubmitting ? "Saving..." : (isEdit ? "Update Sprint" : "Create Sprint")}
          </Button>
        </div>
      </form>
    </Form>
  )
}