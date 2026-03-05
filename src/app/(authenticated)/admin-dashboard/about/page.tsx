"use client"
import * as React from "react"
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Info, 
  Camera, 
  Save, 
  X, 
  Edit2, 
  Briefcase, 
  Globe, 
  Mail, 
  Phone 
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/useAuth"
import { getOrganisationProfileDetailsAction, updateOrganisationProfileClientAction } from "@/actions/user-management"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export default function OrganizationAboutPage() {
  const { user } = useAuth()
  const [org, setOrg] = React.useState<any>(null)
  const [isEditing, setIsEditing] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  
  const [editForm, setEditForm] = React.useState({ 
    name: "", about: "", location: "", logo_path: "",
    website_url: "", contact_email: "", contact_phone: "", industry: "" 
  })

  const loadData = React.useCallback(async () => {
    if (!user?.id) return;
    const res = await getOrganisationProfileDetailsAction(user.id);
    const orgArray = res.organisation?.organisations;
    const orgData = Array.isArray(orgArray) ? orgArray[0] : orgArray;

    if (res.success && orgData) {
      setOrg(orgData);
      setEditForm({ 
        name: orgData.name || "", 
        about: orgData.about || "", 
        location: orgData.location || "", 
        logo_path: orgData.logo_path || "",
        website_url: orgData.website_url || "",
        contact_email: orgData.contact_email || "",
        contact_phone: orgData.contact_phone || "",
        industry: orgData.industry || ""
      });
    }
    setLoading(false);
  }, [user?.id]);

  React.useEffect(() => { loadData() }, [loadData])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !org?.id) return
    const fileExt = file.name.split('.').pop()
    const filePath = `${org.id}/logo-${Date.now()}.${fileExt}`
    const { error } = await supabase.storage.from('logos').upload(filePath, file)
    if (error) return toast.error("Logo upload failed")
    setEditForm(prev => ({ ...prev, logo_path: filePath }))
    toast.success("Logo uploaded. Save changes to apply.")
  }

  const handleSave = async () => {
    const res = await updateOrganisationProfileClientAction(org.id, editForm)
    if (res.success) {
      toast.success("Profile updated")
      setIsEditing(false)
      loadData()
    } else {
      toast.error(res.error || "Update failed")
    }
  }

  if (loading) return <div className="p-10 text-center text-slate-500 font-sans">Loading Profile...</div>

  const logoUrl = editForm.logo_path 
    ? supabase.storage.from('logos').getPublicUrl(editForm.logo_path).data.publicUrl 
    : null

  const formattedWebsite = editForm.website_url 
    ? (editForm.website_url.startsWith('http') ? editForm.website_url : `https://${editForm.website_url}`)
    : "#"

  return (
    <div className="max-w-full ml-0 lg:ml-4 pr-4 space-y-6 pt-6 font-sans">
      <div className="flex justify-end">
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="bg-[#006AFF] hover:bg-[#006AFF]/90 gap-2 rounded-xl h-10 px-6 shadow-sm transition-all active:scale-95">
            <Edit2 className="h-4 w-4" /> Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => setIsEditing(false)} variant="outline" className="rounded-xl border-slate-200 hover:bg-slate-50">Cancel</Button>
            <Button onClick={handleSave} className="bg-[#006AFF] hover:bg-[#006AFF]/90 rounded-xl px-6 shadow-md active:scale-95">
              <Save className="h-4 w-4 mr-2" /> Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT CARD: IDENTITY */}
        <div className="lg:col-span-4 h-fit">
          <Card className="border-none shadow-sm bg-white rounded-3xl p-8 text-center flex flex-col items-center justify-center space-y-6 overflow-hidden">
            <div className="relative group">
              <Avatar className="h-36 w-36 border-4 border-slate-50 shadow-md">
                {logoUrl && <AvatarImage src={logoUrl} className="object-cover" />}
                <AvatarFallback className="bg-[#006AFF] text-white text-5xl font-bold">
                  {editForm.name?.charAt(0).toUpperCase() || "M"}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <label className="absolute bottom-2 right-2 bg-white p-2.5 rounded-full shadow-lg border border-slate-100 cursor-pointer hover:text-[#006AFF]">
                  <Camera className="h-5 w-5" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                </label>
              )}
            </div>
            <div className="space-y-1 w-full overflow-hidden">
              {isEditing ? (
                <Input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="text-center font-bold text-xl rounded-xl h-12" />
              ) : (
                <h2 className="text-2xl font-semibold text-[#0F172A] truncate px-2">{org?.name}</h2>
              )}
       
            </div>
          </Card>
        </div>

        {/* RIGHT CARD: GENERAL INFO */}
        <Card className="lg:col-span-8 border-none shadow-sm bg-white rounded-3xl p-8 overflow-hidden">
          <div className="flex items-center gap-2 mb-8">
     
            <h3 className="text-lg font-semibold text-[#0F172A]">Organization Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-x-10 gap-y-6">
            <div className="space-y-1 min-w-0">
              <Label className=" text-sm  font-semi-bold  text-slate-400 tracking-widest">About</Label>
              {isEditing ? (
                <Textarea value={editForm.about} onChange={(e) => setEditForm({...editForm, about: e.target.value})} className="min-h-[120px] rounded-xl text-sm" />
              ) : (
                <p className="text-[10px]  text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                  {org?.about || "No description provided."}
                </p>
              )}
            </div>

            <div className="space-y-4 min-w-0">
              <div>
                <Label className="text-sm  font-semi-bold  text-slate-400 tracking-widest">Industry</Label>
                {isEditing ? (
                  <Input value={editForm.industry} onChange={(e) => setEditForm({...editForm, industry: e.target.value})} className="h-9 rounded-lg" />
                ) : (
                  <div className=" text-[10px] flex items-center gap-2 text-sm text-slate-700 font-medium truncate">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> 
                    {org?.industry || 'Not specified'}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm  font-semi-bold  text-slate-400 tracking-widest">Location</Label>
                {isEditing ? (
                  <Input value={editForm.location} onChange={(e) => setEditForm({...editForm, location: e.target.value})} className="h-9 rounded-lg" />
                ) : (
                  <div className="text-[10px] flex items-center gap-2 text-sm text-slate-700 font-medium break-words">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> {org?.location}
                  </div>
                )}
              </div>
              
              <div>
                <Label className="text-sm  font-semi-bold  text-slate-400 tracking-widest">Website</Label>
                {isEditing ? (
                  <Input value={editForm.website_url} onChange={(e) => setEditForm({...editForm, website_url: e.target.value})} className="h-9 rounded-lg" />
                ) : (
                  <div className="flex items-center gap-2 text-sm font-medium truncate">
                    <Globe className="h-3.5 w-3.5 text-[#006AFF] flex-shrink-0" /> 
                    <a href={formattedWebsite} target="_blank" rel="noopener noreferrer" className="text-[#006AFF] text-[10px] hover:underline truncate">
                      {org?.website_url || 'Not set'}
                    </a>
                  </div>
                )}
              </div>

              {/* RESTORED EDITABLE EMAIL AND PHONE */}
              <div className="grid grid-cols-2 gap-4">
                <div className="min-w-0">
                   <Label className="text-sm  font-semi-bold  text-slate-400 tracking-widest">Email</Label>
                   {isEditing ? (
                     <Input 
                       value={editForm.contact_email} 
                       onChange={(e) => setEditForm({...editForm, contact_email: e.target.value})} 
                       className="h-9 rounded-lg text-xs" 
                     />
                   ) : (
                     <p className=" text-[10px] text-xs font-medium text-slate-700 truncate">{org?.contact_email || 'N/A'}</p>
                   )}
                </div>
                <div className="min-w-0">
                   <Label className="text-sm  font-semi-bold  text-slate-400 tracking-widest">Phone</Label>
                   {isEditing ? (
                     <Input 
                       value={editForm.contact_phone} 
                       onChange={(e) => setEditForm({...editForm, contact_phone: e.target.value})} 
                       className="h-9 rounded-lg text-xs" 
                     />
                   ) : (
                     <p className="text-[10px] text-xs font-medium text-slate-700 truncate">{org?.contact_phone || 'N/A'}</p>
                   )}
                </div>
              </div>

              <div>
                <Label className="text-sm  font-semi-bold text-slate-400 tracking-widest">Member Since</Label>
                <div className="text-[10px] flex items-center gap-2 text-sm text-slate-700 font-medium"><Calendar className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> {org?.created_at ? new Date(org.created_at).toLocaleDateString() : 'N/A'}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}