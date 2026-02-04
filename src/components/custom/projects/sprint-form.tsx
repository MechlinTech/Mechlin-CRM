"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form"
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel className="text-[10px] font-bold uppercase">Sprint Name</FormLabel><Input {...field} /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel className="text-[10px] font-bold uppercase">Description</FormLabel><Textarea {...field} /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="start_date" render={({ field }) => (
            <FormItem><FormLabel className="text-[10px] font-bold uppercase">Start Date</FormLabel><Input type="date" {...field} /></FormItem>
          )} />
          <FormField control={form.control} name="end_date" render={({ field }) => (
            <FormItem><FormLabel className="text-[10px] font-bold uppercase">End Date</FormLabel><Input type="date" {...field} /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-bold uppercase">Status</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Delayed">Delayed</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )} />
        <Button type="submit" className="w-full bg-black text-white font-bold h-11 uppercase text-[10px]">
          {isEdit ? "Update Sprint" : "Create Sprint"}
        </Button>
      </form>
    </Form>
  )
}