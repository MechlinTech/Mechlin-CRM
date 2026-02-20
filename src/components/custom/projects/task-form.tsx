"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createTaskAction, updateTaskAction } from "@/actions/hierarchy"
import { toast } from "sonner"
import { ActionModalContext } from "@/components/shared/action-button"
import { WysiwygEditor } from "@/components/shared/wysiwyg-editorPM"

// 1. Define the Validation Schema
const taskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").max(255, "Title too long"),
  status: z.string().min(1, "Status is required"),
})

type TaskFormValues = z.infer<typeof taskSchema>

export function TaskForm({ ids, task, onSuccess }: { ids: any, task?: any, onSuccess?: () => void }) {
  const { close } = React.useContext(ActionModalContext);
  const [description, setDescription] = React.useState(task?.description || "");
  
  // 2. Initialize form with Zod
  const form = useForm<TaskFormValues>({ 
    resolver: zodResolver(taskSchema),
    defaultValues: { 
      title: task?.title || "", 
      status: task?.status || "Pending" 
    } 
  });

  async function onSubmit(values: TaskFormValues) {
    // Note: description is managed by separate state for the WYSIWYG editor
    const res = task 
      ? await updateTaskAction(task.id, ids.project_id, { ...values, description }) 
      : await createTaskAction({ ...values, description, ...ids });
      
    if (res.success) { 
      toast.success("Saved successfully"); 
      onSuccess?.(); 
      close(); 
    } else {
      toast.error(res.error || "Failed to save task");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2 text-[#0F172A] font-sans">
        {/* Title Field */}
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Task Title</FormLabel>
            <FormControl>
              <Input 
                {...field} 
                className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10 focus:border-[#006AFF] transition-all" 
                placeholder="Enter task title" 
              />
            </FormControl>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )} />
        
        {/* Description Field (Custom State) */}
        <div className="space-y-2">
            <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Task Description</FormLabel>
            <WysiwygEditor content={description} onChange={setDescription} />
            {/* Manual help text if description is optional in schema but you want to guide the user */}
            <p className="text-[10px] text-slate-400">Detailed requirements for this task.</p>
        </div>
        
        {/* Status Field */}
        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-medium uppercase text-slate-400 tracking-widest">Status</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10 cursor-pointer focus:border-[#006AFF] transition-all">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-white border-slate-200 rounded-xl shadow-2xl">
                <SelectItem value="Pending" className="cursor-pointer text-xs">Pending</SelectItem>
                <SelectItem value="In Progress" className="cursor-pointer text-xs">In Progress</SelectItem>
                <SelectItem value="Completed" className="cursor-pointer text-xs">Completed</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )} />
        
        <Button 
          type="submit" 
          disabled={form.formState.isSubmitting}
          className="w-full bg-[#006AFF] text-white font-semibold h-12 rounded-xl shadow-lg hover:bg-[#1a7bff] transition-all active:scale-95"
        >
          {form.formState.isSubmitting ? 'Saving...' : 'Save Task'}
        </Button>
      </form>
    </Form>
  )
}