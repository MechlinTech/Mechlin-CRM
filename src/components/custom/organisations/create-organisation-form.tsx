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
import { createOrganisationAction, updateOrganisationAction, type Organisation, type EscalationContact } from "@/actions/user-management"

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

  const updateContact = (index: number, field: keyof EscalationContact, fieldValue: string) => {
    const updatedContacts = [...value]
    updatedContacts[index] = { ...updatedContacts[index], [field]: fieldValue }
    onChange(updatedContacts)
  }

  const removeContact = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      {/* Add User from Organization */}
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

      {/* Existing Contacts */}
      {value.length > 0 && (
        <div className="space-y-2">
          <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Current Escalation Contacts
          </FormLabel>
          {value.map((contact, index) => (
            <div key={index} className="grid grid-cols-4 gap-2">
              <div className="col-span-1">
                <Input
                  placeholder="Name"
                  value={contact.name}
                  onChange={(e) => updateContact(index, 'name', e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="col-span-1">
                <Input
                  placeholder="Email"
                  value={contact.email}
                  onChange={(e) => updateContact(index, 'email', e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="col-span-1">
                <Input
                  placeholder="Phone (optional)"
                  value={contact.phone || ""}
                  onChange={(e) => updateContact(index, 'phone', e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="col-span-1">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => removeContact(index)}
                  className="w-full"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Zod schema matching the database schema
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

  const form = useForm<OrganisationFormValues>({
    resolver: zodResolver(organisationSchema),
    defaultValues: {
      name: "",
      slug: "",
      status: "active",
      escalation_contacts: [],
    },
  })

  // Pre-fill form when organisation is provided (edit mode)
  useEffect(() => {
    if (organisation) {
      form.reset({
        name: organisation.name,
        slug: organisation.slug,
        status: organisation.status,
        escalation_contacts: organisation.escalation_contacts || [],
      })
    } else {
      // Reset to default values when not in edit mode
      form.reset({
        name: "",
        slug: "",
        status: "active",
        escalation_contacts: [],
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
      } else {
        // Create new organisation
        result = await createOrganisationAction({
          name: data.name,
          slug: data.slug,
          status: data.status,
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
      }
      
      // Refresh the page to show the updated/new organisation
      router.refresh()
      
      // Close the dialog after successful operation
      if (onSuccess) {
        onSuccess()
      }
      form.reset()
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
