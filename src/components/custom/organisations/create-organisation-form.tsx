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
import { Checkbox } from "@/components/ui/checkbox"
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
import { createOrganisationAction, updateOrganisationAction, type Organisation, type EscalationContact } from "@/actions/user-management"
import { useRBAC } from "@/context/rbac-context"

// Escalation Contacts Field Component
function EscalationContactsField({ value, onChange, organisationId }: { 
  value: EscalationContact[], 
  onChange: (contacts: EscalationContact[]) => void,
  organisationId?: string 
}) {
  const [users, setUsers] = useState<Array<{id: string, name: string, email: string}>>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Fetch users for the current organization
  useEffect(() => {
    const fetchUsers = async () => {
      if (!organisationId) return
      
      setLoadingUsers(true)
      try {
        const response = await fetch(`/api/organisation-users?organisationId=${organisationId}`)
        if (response.ok) {
          const orgUsers = await response.json()
          setUsers(orgUsers)
        }
      } catch (error) {
        console.error('Failed to fetch users:', error)
      } finally {
        setLoadingUsers(false)
      }
    }
    
    fetchUsers()
  }, [organisationId])

  const addUserContact = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user && !value.some(contact => contact.email === user.email)) {
      const newContact: EscalationContact = {
        name: user.name,
        email: user.email
      }
      onChange([...value, newContact])
    }
  }

  const removeContact = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      {organisationId && (
        <div className="space-y-2">
          <Select
            onValueChange={(value) => {
              if (value) {
                addUserContact(value)
              }
            }}
            disabled={loadingUsers}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select user from organization..." />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription className="text-sm text-muted-foreground">
            Select a user from this organization to add as an escalation contact.
          </FormDescription>
        </div>
      )}

      {value.length > 0 && (
        <div className="space-y-2">
          <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Current Escalation Contacts
          </FormLabel>
          {value.map((contact, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
              <div className="flex-1">
                <div className="text-sm font-medium">{contact.name}</div>
                <div className="text-sm text-gray-600">{contact.email}</div>
                {contact.phone && <div className="text-sm text-gray-600">{contact.phone}</div>}
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => removeContact(index)}
                className="ml-4"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const escalationContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional()
})

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
  is_internal: z.boolean(),
  escalation_contacts: z.array(escalationContactSchema).optional()
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
  const { hasPermission } = useRBAC();

  const form = useForm<OrganisationFormValues>({
    resolver: zodResolver(organisationSchema),
    defaultValues: {
      name: "",
      slug: "",
      status: "active",
      is_internal: false,
      escalation_contacts: [],
    },
  })

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // Watch name changes and update slug
  const nameValue = form.watch("name")
  useEffect(() => {
    if (!isEditMode && nameValue) {
      const slug = generateSlug(nameValue)
      form.setValue("slug", slug)
    }
  }, [nameValue, form, isEditMode])

  useEffect(() => {
    if (organisation) {
      form.reset({
        name: organisation.name,
        slug: organisation.slug,
        status: organisation.status,
        is_internal: organisation.is_internal || false,
        escalation_contacts: organisation.escalation_contacts || [],
      })
    } else {
      form.reset({
        name: "",
        slug: "",
        status: "active",
        is_internal: false,
        escalation_contacts: [],
      })
    }
  }, [organisation, form])

  async function onSubmit(data: OrganisationFormValues) {
    setLoading(true)
    try {
      let result
      if (isEditMode && organisation) {
        // RBAC: Update Check
        if (!hasPermission('organisations.update')) {
            toast.error("Unauthorized to update organisations");
            setLoading(false);
            return;
        }

        result = await updateOrganisationAction(organisation.id, {
          name: data.name,
          slug: data.slug,
          status: data.status,
          is_internal: data.is_internal,
          escalation_contacts: data.escalation_contacts,
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
        
        // Auto-close modal after successful update
        setTimeout(() => {
          form.reset()
          if (onSuccess) {
            onSuccess()
          }
        }, 1500)
      } else {
        // RBAC: Create Check
        if (!hasPermission('organisations.create')) {
            toast.error("Unauthorized to create organisations");
            setLoading(false);
            return;
        }

        result = await createOrganisationAction({
          name: data.name,
          slug: data.slug,
          status: data.status,
          is_internal: data.is_internal,
          escalation_contacts: data.escalation_contacts,
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
        
        // Auto-close modal after successful creation
        setTimeout(() => {
          form.reset()
          if (onSuccess) {
            onSuccess()
          }
        }, 1500)
      }
      
      router.refresh()
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full flex flex-col max-h-[80vh] overflow-y-auto pr-2">
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
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Slug field - hidden in create mode, shown in edit mode */}
        {isEditMode && (
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
        )}

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

 <FormField
  control={form.control}
  name="is_internal"
  render={({ field }) => (
    <FormItem className="flex items-center space-x-3 rounded-md border p-4">
      <FormControl>
        <Checkbox
          className="translate-y-[1px]"
          checked={field.value}
          onCheckedChange={field.onChange}
          disabled={loading}
        />
      </FormControl>

      <FormLabel className="leading-none cursor-pointer">
        Internal Organization
      </FormLabel>

      <FormMessage />
    </FormItem>
  )}
/>


        <FormField
          control={form.control}
          name="escalation_contacts"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Escalation Contacts</FormLabel>
              <FormControl>
                <EscalationContactsField 
                  value={field.value || []}
                  onChange={field.onChange}
                  organisationId={organisation?.id}
                />
              </FormControl>
              <FormDescription>
                Add escalation contacts for this organisation. Select users from the organization or add manual contacts.
              </FormDescription>
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