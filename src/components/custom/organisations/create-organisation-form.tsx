"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createOrganisationAction, updateOrganisationAction, type Organisation } from "@/actions/user-management"

// Zod schema matching the database schema
const organisationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be less than 255 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must be less than 100 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens (e.g., my-org-123)"
    ),
  status: z.enum(["active", "suspended", "trial"]),
})

type OrganisationFormValues = z.infer<typeof organisationSchema>

interface CreateOrganisationFormProps {
  onSuccess?: () => void
  organisation?: Organisation | null
}

export function CreateOrganisationForm({ onSuccess, organisation }: CreateOrganisationFormProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const isEditMode = !!organisation

  const form = useForm<OrganisationFormValues>({
    resolver: zodResolver(organisationSchema),
    defaultValues: {
      name: "",
      slug: "",
      status: "active",
    },
  })

  // Pre-fill form when organisation is provided (edit mode)
  useEffect(() => {
    if (organisation) {
      form.reset({
        name: organisation.name,
        slug: organisation.slug,
        status: organisation.status,
      })
    } else {
      // Reset to default values when not in edit mode
      form.reset({
        name: "",
        slug: "",
        status: "active",
      })
    }
  }, [organisation, form])

  async function onSubmit(data: OrganisationFormValues) {
    setLoading(true)
    try {
      let result
      if (isEditMode && organisation) {
        // Update existing organisation
        result = await updateOrganisationAction(organisation.id, {
          name: data.name,
          slug: data.slug,
          status: data.status,
        })
        if (!result.success) {
          if (result.code === "23505") {
            toast.error("Slug already exists")
            form.setError("slug", { message: "Taken" })
          } else {
            toast.error(result.error)
          }
          return
        }
        toast.success("Organisation updated successfully!")
      } else {
        // Create new organisation
        result = await createOrganisationAction({
          name: data.name,
          slug: data.slug,
          status: data.status,
        })
        if (!result.success) {
          if (result.code === "23505") {
            toast.error("Slug already exists")
            form.setError("slug", { message: "Taken" })
          } else {
            toast.error(result.error)
          }
          return
        }
        toast.success("Organisation created successfully!")
        form.reset()
      }
      
      // Refresh the page to show the updated/new organisation
      router.refresh()
      
      // Close the dialog after successful operation
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      toast.error("An unexpected error occurred")
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full flex flex-col">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter organisation name"
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              {/* <FormDescription>
                The display name of the organisation (max 255 characters)
              </FormDescription> */}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input
                  placeholder="my-organisation"
                  {...field}
                  disabled={loading}
                  onChange={(e) => {
                    // Auto-convert to lowercase and replace spaces with hyphens
                    const value = e.target.value
                      .toLowerCase()
                      .replace(/\s+/g, "-")
                      .replace(/[^a-z0-9-]/g, "")
                    field.onChange(value)
                  }}
                />
              </FormControl>
              <FormDescription>
                A unique URL-friendly identifier (lowercase, alphanumeric with hyphens, max 100 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={loading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading} className="ml-auto">
          {loading 
            ? (isEditMode ? "Updating..." : "Creating...") 
            : (isEditMode ? "Update Organisation" : "Create Organisation")}
        </Button>
      </form>
    </Form>
  )
}
