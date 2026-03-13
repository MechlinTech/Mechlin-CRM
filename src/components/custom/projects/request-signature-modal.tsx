"use client"
import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PenTool, X, Check, FileText, Info } from "lucide-react" // Added Info icon
import { supabase } from "@/lib/supabase"
import { MemberMultiSelect } from "./member-multi-select"
import { requestSignatureAction } from "@/actions/signature-requests"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"

export function RequestSignatureModal({ projectId }: { projectId: string }) {
  const [open, setOpen] = React.useState(false);
  const [docs, setDocs] = React.useState<any[]>([]);
  const [selectedDocIds, setSelectedDocIds] = React.useState<string[]>([]);
  const [mechlinTeam, setMechlinTeam] = React.useState<any[]>([]);
  const [clientTeam, setClientTeam] = React.useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    (async () => {
      // Fetching file_url to verify it's a PDF
      const { data: pDocs } = await supabase.from("documents").select("id, name, file_url").eq("project_id", projectId);
      const { data: pMembers } = await supabase.from("projects").select(`project_members(users(id, name, email, organisations(is_internal)))`).eq("id", projectId).single();
      
      // RESTRICTION: Only allow PDF files
      const pdfOnly = (pDocs || []).filter(doc => 
        doc.name?.toLowerCase().endsWith('.pdf') || 
        doc.file_url?.toLowerCase().split('?')[0].endsWith('.pdf')
      );

      setDocs(pdfOnly);
      const members = pMembers?.project_members || [];
      setMechlinTeam(members.filter((m: any) => m.users?.organisations?.is_internal));
      setClientTeam(members.filter((m: any) => !m.users?.organisations?.is_internal));
    })();
  }, [open, projectId]);

  const handleRequest = async () => {
    if (selectedDocIds.length === 0 || selectedMembers.length === 0) {
      return toast.error("Select at least one document and one signer");
    }
    setLoading(true);
    const res = await requestSignatureAction(projectId, selectedDocIds, selectedMembers);
    setLoading(false);
    if (res.success) {
      toast.success(`Requests sent for ${selectedDocIds.length} documents`);
      setSelectedDocIds([]);
      setSelectedMembers([]);
      setOpen(false);
    } else toast.error(res.error);
  };

  const toggleDoc = (id: string) => {   
    setSelectedDocIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <PenTool className="h-3.5 w-3.5 mr-2" /> Request Signature
        </Button>
      </DialogTrigger>
      
      <DialogContent className="min-w-3xl bg-white rounded-[28px] border-none shadow-2xl p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <DialogTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">Request Signatures</DialogTitle>
      
        </div>

        <div className="p-2 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* Professional Restriction Notice */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
            <Info className="h-4 w-4 text-[#006AFF] mt-0.5" />
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-[#006AFF] uppercase tracking-wider">PDF Requirement</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                To ensure document integrity, only **PDF files** are compatible with our digital signature workflow. Non-PDF files are excluded from this list.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between">
              Select Documents <span>{selectedDocIds.length} selected</span>
            </label>
            <div className="border border-slate-200 rounded-xl p-3 h-[180px] overflow-y-auto bg-slate-50/30">
              {docs.length > 0 ? docs.map((d) => (
                <div key={d.id} className="flex items-center space-x-2 py-2 group border-b border-slate-100 last:border-0">
                  <Checkbox 
                    id={d.id}
                    checked={selectedDocIds.includes(d.id)}
                    onCheckedChange={() => toggleDoc(d.id)}
                    className="border-slate-300 data-[state=checked]:bg-[#006AFF] cursor-pointer"
                  />
                  <label htmlFor={d.id} className="text-xs font-medium text-slate-700 cursor-pointer flex items-center gap-2 group-hover:text-[#006AFF] transition-colors">
                    <FileText className="h-3.5 w-3.5 text-slate-400" /> {d.name}
                  </label>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-10 space-y-2">
                  <FileText className="h-8 w-8 text-slate-200" />
                  <p className="text-xs text-slate-400 italic">No PDF documents available in this project</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MemberMultiSelect label="Mechlin Team Members" members={mechlinTeam} selected={selectedMembers} onChange={setSelectedMembers} />
            <MemberMultiSelect label="Client Side Users" members={clientTeam} selected={selectedMembers} onChange={setSelectedMembers} />
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <Button 
            onClick={handleRequest} 
            disabled={loading || selectedDocIds.length === 0 || selectedMembers.length === 0} 
            className="w-full bg-[#006AFF] hover:bg-[#0056CC] text-white h-14 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg active:scale-[0.98]"
          >
            {loading ? "Processing..." : `Send Request Emails `}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}