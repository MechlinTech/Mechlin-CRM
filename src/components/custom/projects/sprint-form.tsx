"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createSprintAction, updateSprintAction } from "@/actions/hierarchy"
import { toast } from "sonner"

export function SprintForm({ milestoneId, projectId, sprint, onSuccess }: any) {
  const isEdit = !!sprint
  const form = useForm({
    defaultValues: {
      name: sprint?.name || "",
      description: sprint?.description || "",
      start_date: sprint?.start_date || "",
      end_date: sprint?.end_date || "",
      status: sprint?.status || "Active"
    }
  })

  async function onSubmit(values: any) {
    const res = isEdit 
      ? await updateSprintAction(sprint.id, projectId, values)
      : await createSprintAction(milestoneId, projectId, values);

    if (res.success) {
      toast.success(isEdit ? "Sprint Updated" : "Sprint Created");
      if (onSuccess) onSuccess(); 
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2 font-sans">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Sprint Name</FormLabel>
            <FormControl><Input {...field} className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10" /></FormControl>
          </FormItem>
        )} />
        
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Description</FormLabel>
            <FormControl><Textarea {...field} className="bg-white border-slate-200 rounded-xl text-xs font-medium min-h-[100px] resize-none" /></FormControl>
          </FormItem>
        )} />
        
        {/* Responsive Grid: Stacks on mobile, 2 columns on tablet/desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="start_date" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Start Date</FormLabel>
              <FormControl><Input type="date" {...field} className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10 cursor-pointer" /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="end_date" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">End Date</FormLabel>
              <FormControl><Input type="date" {...field} className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10 cursor-pointer" /></FormControl>
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Status</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10 cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-white border-slate-200 rounded-xl shadow-2xl">
                <SelectItem value="Active" className="text-xs font-medium cursor-pointer">Active</SelectItem>
                <SelectItem value="Completed" className="text-xs font-medium cursor-pointer">Completed</SelectItem>
                <SelectItem value="Delayed" className="text-xs font-medium cursor-pointer">Delayed</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )} />

        <Button 
          type="submit" 
          className="ml-33 w-50 "
        >
          {isEdit ? "Update Sprint" : "Create Sprint"}
        </Button>
      </form>
    </Form>
  )
}