"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { updateOrganisationAction } from "@/actions/user-management"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { CloudUpload, X, Image as ImageIcon } from "lucide-react"

const organisationSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  about: z.string().trim().min(1, "About information is required"),
  location: z.string().trim().min(1, "Location is required"),
  logo_path: z.string().optional(),
})

export function OrganisationForm({ organisation, onSuccess }: any) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [preview, setPreview] = React.useState(organisation?.logo_path ? 
    supabase.storage.from('logos').getPublicUrl(organisation.logo_path).data.publicUrl : null)

  const form = useForm<z.infer<typeof organisationSchema>>({
    resolver: zodResolver(organisationSchema),
    defaultValues: {
      name: organisation?.name || "",
      about: organisation?.about || "",
      location: organisation?.location || "",
      logo_path: organisation?.logo_path || "",
    }
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const fileExt = file.name.split('.').pop()
    const filePath = `${organisation.id}/logo-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      toast.error("Upload failed")
    } else {
      form.setValue('logo_path', filePath)
      const { data } = supabase.storage.from('logos').getPublicUrl(filePath)
      setPreview(data.publicUrl)
      toast.success("Logo uploaded")
    }
    setIsUploading(false)
  }

  async function onSubmit(values: z.infer<typeof organisationSchema>) {
    const res = await updateOrganisationAction(organisation.id, {
      ...values,
      slug: organisation.slug,
      status: organisation.status,
      is_internal: organisation.is_internal,
      escalation_contacts: organisation.escalation_contacts
    } as any)

    if (res.success) {
      toast.success("Profile Updated")
      onSuccess?.()
    } else {
      toast.error(res.error || "Update failed")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2 font-sans text-[#0F172A]">
        
        {/* LOGO UPLOAD SECTION */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Org Logo</label>
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center bg-slate-50/30 hover:bg-white hover:border-[#006AFF]/50 transition-all relative group">
            {preview ? (
              <div className="relative h-20 w-20">
                <img src={preview} className="h-full w-full object-cover rounded-xl" alt="Preview" />
                <button type="button" onClick={() => { setPreview(null); form.setValue('logo_path', ''); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="h-3 w-3" /></button>
              </div>
            ) : (
              <>
                <CloudUpload className="h-8 w-8 text-slate-400 mb-2 group-hover:text-[#006AFF]" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Click to upload logo</p>
              </>
            )}
            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </div>

        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Org Name</FormLabel>
            <FormControl>
              <Input {...field} className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10 w-full break-words" />
            </FormControl>
          </FormItem>
        )} />

        <FormField control={form.control} name="location" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Location</FormLabel>
            <FormControl>
              <Input {...field} className="bg-white border-slate-200 rounded-xl text-xs font-medium h-10 w-full break-all" />
            </FormControl>
          </FormItem>
        )} />

        <FormField control={form.control} name="about" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">About Organization</FormLabel>
            <FormControl>
              <Textarea {...field} className="bg-white border-slate-200 rounded-xl text-xs font-medium min-h-[100px] resize-none w-full break-words whitespace-pre-wrap" />
            </FormControl>
          </FormItem>
        )} />

        <Button type="submit" disabled={form.formState.isSubmitting || isUploading} className="w-full bg-[#006AFF] text-white font-semibold h-12 rounded-xl shadow-lg hover:bg-[#1a7bff] transition-all active:scale-95 mt-2">
          {form.formState.isSubmitting ? 'Updating...' : 'Save Profile Changes'}
        </Button>
      </form>
    </Form>
  )
}