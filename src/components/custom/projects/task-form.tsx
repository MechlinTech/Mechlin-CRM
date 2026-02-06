"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createTaskAction, updateTaskAction } from "@/actions/hierarchy"
import { toast } from "sonner"
import { ActionModalContext } from "@/components/shared/action-button"

export function TaskForm({ ids, task, onSuccess }: { 
  ids: { project_id: string, phase_id: string, milestone_id: string, sprint_id: string },
  task?: any,
  onSuccess?: () => void 
}) {
  const { close } = React.useContext(ActionModalContext);
  const isEdit = !!task;

  const form = useForm({
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      status: task?.status || "Pending"
    }
  });

  async function onSubmit(values: any) {
    const res = isEdit 
      ? await updateTaskAction(task.id, ids.project_id, values)
      : await createTaskAction({ ...values, ...ids });

    if (res.success) {
      toast.success(isEdit ? "Task updated" : "Task added to sprint");
      if (onSuccess) onSuccess(); // This refreshes the data on the page
      close(); // This closes the dialog
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 text-black">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel className="text-[10px] font-bold uppercase">Task Title</FormLabel><Input {...field} /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel className="text-[10px] font-bold uppercase">Description</FormLabel><Textarea {...field} /></FormItem>
        )} />
        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-bold uppercase">Status</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )} />
        <Button type="submit" className="w-full bg-black text-white font-black h-12 uppercase text-xs">
          {isEdit ? "Update Task" : "Add Task"}
        </Button>
      </form>
    </Form>
  )
}