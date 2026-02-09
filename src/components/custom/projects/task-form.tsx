"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createTaskAction, updateTaskAction } from "@/actions/hierarchy"
import { toast } from "sonner"
import { ActionModalContext } from "@/components/shared/action-button"
import { WysiwygEditor } from "@/components/shared/wysiwyg-editorPM"

export function TaskForm({ ids, task, onSuccess }: { ids: any, task?: any, onSuccess?: () => void }) {
  const { close } = React.useContext(ActionModalContext);
  const [description, setDescription] = React.useState(task?.description || "");
  const form = useForm({ defaultValues: { title: task?.title || "", status: task?.status || "Pending" } });

  async function onSubmit(values: any) {
    const res = task ? await updateTaskAction(task.id, ids.project_id, { ...values, description }) : await createTaskAction({ ...values, description, ...ids });
    if (res.success) { toast.success("Saved"); onSuccess?.(); close(); }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4 text-black">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel className="text-[10px] font-bold uppercase">Task Title</FormLabel><Input {...field} /></FormItem>
        )} />
        <div className="space-y-2">
            <FormLabel className="text-[10px] font-bold uppercase">Task Description</FormLabel>
            <WysiwygEditor content={description} onChange={setDescription} />
        </div>
        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem><FormLabel className="text-[10px] font-bold uppercase">Status</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="In Progress">In Progress</SelectItem><SelectItem value="Completed">Completed</SelectItem></SelectContent>
            </Select></FormItem>
        )} />
        <Button type="submit" className="w-full bg-black text-white font-black h-12 uppercase text-xs">Save Task</Button>
      </form>
    </Form>
  )
}