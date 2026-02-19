"use client"

import { supabase } from "@/lib/supabase";
import { 
  ChevronRight, Plus, Pencil, Settings2, Trash2, FolderOpen, 
  FileUp, Activity, Github, ReceiptText, 
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PhaseForm } from "@/components/custom/projects/phase-form";
import { MilestoneForm } from "@/components/custom/projects/milestone-form";
import { CreateProjectForm } from "@/components/custom/projects/create-project-form";
import { InvoiceForm } from "@/components/custom/projects/invoice-form";
import { InvoiceList } from "@/components/custom/projects/invoice-list";
import { deletePhaseAction } from "@/actions/hierarchy";
import { ActionButton } from "@/components/shared/action-button";
import { DocumentForm } from "@/components/custom/projects/document-form";
import Link from "next/link";
import React from "react";
import { ProjectWiki } from "@/components/custom/wiki";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useRBAC } from "@/context/rbac-context"; 
import { redirect,useRouter } from "next/navigation";
import {
  ProjectMilestoneProgressChart,
  ProjectPhaseDistributionChart,
  ProjectBudgetUtilizationChart,
  ProjectTeamActivityChart,
  ProjectTimelineChart
} from "@/components/custom/project-charts";
import { BarChart3, TrendingUp, PieChart } from "lucide-react";

export default function ProjectOverview({ params }: { params: any }) {
  const router = useRouter(); // Initialize the router here
  const { id } = React.use(params) as any;
  const [project, setProject] = React.useState<any>(null);
  const [organisations, setOrganisations] = React.useState<any[]>([]);
  
  const { hasPermission, loading } = useRBAC();

  // TOP LEVEL REDIRECT: Redirect if user cannot read projects 
  if (!loading && !hasPermission('projects.read')) {
    redirect('/unauthorized');
  }

  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isAddPhaseOpen, setIsAddPhaseOpen] = React.useState(false);
  const [activeMilestonePhase, setActiveMilestonePhase] = React.useState<string | null>(null);
  const [editingPhaseId, setEditingPhaseId] = React.useState<string | null>(null);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = React.useState(false);

  const loadData = React.useCallback(async () => {
    const { data: p } = await supabase
      .from("projects")
      .select("*, organisations(*), phases(*, milestones(*, sprints(*))), invoices(*), project_members(user_id, users(id, name))")
      .eq("id", id)
      .single();
      
    const { data: o } = await supabase.from("organisations").select("*");
    setProject(p);
    setOrganisations(o || []);
  }, [id]);

  React.useEffect(() => { loadData(); }, [loadData]);

  if (!project) return null;

  const members = project.project_members || [];
  const displayMembers = members.slice(0, 5);
  const remainingCount = members.length - 5;

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 px-4 sm:px-6 lg:px-0 text-[#0F172A] font-sans">
      {/* 1. TOP SECTION */}
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Project Management
          </Button>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <section className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-semibold tracking-tight">{project.name}</h1>
                <Badge variant="outline" className="text-[#006AFF] border-[#006AFF]/20 bg-[#006AFF]/5 px-3 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider">{project.status || 'Active'}</Badge>
              </div>
              <p className="text-sm font-medium text-slate-500">{project.organisations?.name}</p>
            </div>

            {!loading && hasPermission('projects.update') && (
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <button className="h-9 w-9 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-[#006AFF] hover:border-[#006AFF] transition-all active:scale-95 bg-white"><Settings2 className="h-4 w-4" /></button>
                </DialogTrigger>
                <DialogContent className="bg-white max-w-[95vw] sm:max-w-lg border-none shadow-2xl">
                  <DialogHeader><DialogTitle className="text-lg font-semibold">Edit Project Profile</DialogTitle></DialogHeader>
                  <CreateProjectForm project={project} organisations={organisations} onSuccess={() => { setIsSettingsOpen(false); loadData(); }} />
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div className="text-sm text-slate-500 font-normal leading-relaxed max-w-lg mb-8">Management of assets, financial documents, and the roadmap for {project.name}.</div>
          <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-slate-100">
            {loading ? (
              <Button variant="secondary" className="h-10 w-32" disabled>
                <FileUp className="h-4 w-4 " /> Upload
              </Button>
            ) : hasPermission('documents.create') ? (
              <ActionButton title="Upload" trigger={
                <Button variant="secondary" className="h-10 w-32">
                  <FileUp className="h-4 w-4" /> Upload
                </Button>
              }>
                <DocumentForm projectId={id} ids={{}} />
              </ActionButton>
            ) : null}
            <Link href={`/projects/${id}/documents`} className="flex items-center justify-center h-10 w-32 bg-[#006AFF] text-white rounded-md font-semibold text-xs gap-2 hover:bg-[#99C4FF] transition-all shadow-md active:scale-95 whitespace-nowrap">
                <FolderOpen className="h-4 w-4" /> View Doc
            </Link>
          </div>
        </section>

        <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between overflow-hidden">
            <div className="flex items-center gap-2 mb-6">
                <Activity className="h-4 w-4 text-[#006AFF]" />
                <h3 className="text-sm font-semibold tracking-wide">Project Stats</h3>
            </div>
            <div className="space-y-4">
                <div className="flex items-center justify-between text-xs gap-2">
                    <span className="text-slate-400 font-medium uppercase tracking-wider">Total Budget</span>
                    <span className="font-semibold text-slate-900">{project.currency} {project.budget?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs gap-2">
                    <span className="text-slate-400 font-medium uppercase tracking-wider">End Date</span>
                    <span className="font-semibold text-slate-900">{project.expected_end_date || 'TBD'}</span>
                </div>
                <div className="flex items-center justify-between text-xs gap-2">
                    <span className="text-slate-400 font-medium uppercase tracking-wider">Repo</span>
                    <a href={project.repo_link || "#"} target="_blank" className="text-[#006AFF] font-semibold hover:underline flex items-center gap-1">Source <Github className="h-3 w-3" /></a>
                </div>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 text-xs">
                <p className="text-[10px] font-medium uppercase text-slate-400 tracking-widest mb-3">Project Members</p>
                <div className="flex items-center -space-x-2">
                    {displayMembers.map((m: any, i: number) => (
                        <div key={i} className="h-8 w-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-medium text-slate-600 shadow-sm ring-1 ring-slate-200 uppercase transition-transform hover:-translate-y-1 cursor-pointer">{m.users?.name?.charAt(0)}</div>
                    ))}
                    {remainingCount > 0 && (
                      <div className="h-8 w-8 rounded-full bg-[#006AFF] border-2 border-white flex items-center justify-center text-[10px] font-semibold text-white shadow-sm ring-1 ring-[#006AFF]/20 uppercase hover:-translate-y-1 cursor-pointer">+{remainingCount}</div>
                    )}
                </div>
            </div>
        </section>
      </div>

      

      {/* 3. ROADMAP SECTION: Check for phases.read  */}
      {!loading && hasPermission('phases.read') && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Project Roadmap</h2>
            {!loading && hasPermission('phases.create') && (
              <Dialog open={isAddPhaseOpen} onOpenChange={setIsAddPhaseOpen}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add Phase</Button></DialogTrigger>
                <DialogContent className="bg-white min-w-[5vw] sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                  <DialogHeader className="p-6 border-b"><DialogTitle className="text-lg font-semibold">Create New Phase</DialogTitle></DialogHeader>
                  <div className="flex-1 overflow-y-auto p-4"><PhaseForm projectId={id} onSuccess={() => { setIsAddPhaseOpen(false); loadData(); }} /></div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid gap-4">
            {project.phases?.map((phase: any) => (
              <Collapsible key={phase.id} className="group border border-slate-100 rounded-3xl bg-white shadow-sm hover:border-[#006AFF]/30 transition-all overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between p-4"> 
                  <CollapsibleTrigger className="flex items-center gap-3 flex-1 p-2 hover:bg-slate-50 rounded-2xl text-left group w-full">
                    <div className=" cursor-pointer h-8 w-8 bg-slate-100 rounded-xl flex items-center justify-center group-data-[state=open]:rotate-90 transition-transform group-hover:bg-[#006AFF] group-hover:text-white shrink-0"><ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-white" /></div>
                    <span className="font-semibold text-sm tracking-tight text-slate-800 truncate">{phase.name}</span>
                  </CollapsibleTrigger>
                  
                  <div className="flex items-center justify-end gap-3 pr-2 w-full md:w-auto p-2 md:p-0">
                    <div className="flex items-center gap-1.5 p-1 bg-white rounded-md border border-slate-100 shadow-sm">
                      {!loading && hasPermission('documents.create') && (
                        <ActionButton title="Upload" trigger={<button className="h-8 w-8  flex items-center justify-center rounded-md text-slate-500 hover:text-[#006AFF] transition-all"><FileUp className="h-4 w-4 
                          cursor-pointer " /></button>}><DocumentForm projectId={id} ids={{ phase_id: phase.id }} /></ActionButton>
                      )}
                      <Link href={`/projects/${id}/documents?phaseId=${phase.id}`} className="h-8 w-8 flex items-center justify-center rounded-md text-slate-500 hover:text-[#006AFF] transition-all"><FolderOpen className="h-4 w-4 " /></Link>
                      <div className="w-[1px] h-4 bg-slate-200 mx-1" />
                      
                      {!loading && hasPermission('phases.update') && (
                        <Dialog open={editingPhaseId === phase.id} onOpenChange={(open) => setEditingPhaseId(open ? phase.id : null)}>
                          <DialogTrigger asChild>
                            <button className="h-8 w-8 flex items-center justify-center rounded-md text-slate-500 hover:text-[#006AFF] transition-all">
                              <Pencil className="h-4 w-4 cursor-pointer" />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="bg-white max-w-[95vw] sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                            <DialogHeader className="p-6 border-b"><DialogTitle className="text-lg font-semibold">Edit Phase</DialogTitle></DialogHeader>
                            <div className="flex-1 overflow-y-auto p-4">
                              <PhaseForm 
                                projectId={id} 
                                phase={phase} 
                                onSuccess={() => { 
                                  setEditingPhaseId(null); 
                                  loadData(); 
                                }} 
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      {!loading && hasPermission('phases.delete') && (
                        <form action={async () => { if(confirm('Delete phase?')) { await deletePhaseAction(phase.id, id); loadData(); } }}>
                            <button type="submit" className="h-8 w-8 flex items-center justify-center rounded-md text-slate-500 hover:text-red-500 transition-all"><Trash2 className="h-4 w-4 cursor-pointer" /></button>
                        </form>
                      )}
                    </div>
                    
                    {!loading && hasPermission('milestones.create') && (
                      <Dialog open={activeMilestonePhase === phase.id} onOpenChange={(open) => setActiveMilestonePhase(open ? phase.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="default" size="sm" className="h-9">
                              <Plus className="h-3 w-3" /> Milestone
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white max-w-[95vw] sm:max-w-lg border-none shadow-2xl">
                          <DialogHeader><DialogTitle className="text-sm font-semibold">Add Milestone to {phase.name}</DialogTitle></DialogHeader>
                          <MilestoneForm projectId={id} phaseId={phase.id} onSuccess={() => { setActiveMilestonePhase(null); loadData(); }} />
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
                <CollapsibleContent className="border-t border-slate-50 bg-slate-50/20">
                  <div className="p-4 sm:p-6 sm:pl-20 space-y-3">
                    {/* MILESTONE CARD: Check for milestones.read  */}
                    {!loading && hasPermission('milestones.read') && phase.milestones?.map((m: any) => (
                      <Link key={m.id} href={`/projects/${id}/phases/${phase.id}/milestones/${m.id}`} className="flex items-center justify-between p-4 sm:p-5 bg-white border border-slate-100 rounded-2xl hover:border-[#006AFF]/20 transition-all group shadow-sm">
                        <span className="font-medium text-slate-700 text-sm">{m.name}</span>
                        <div className="flex items-center gap-5 shrink-0">
                     
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#006AFF] transition-transform group-hover:translate-x-1" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </section>
      )}

      {/* 3. FINANCIALS */}
      <section className="space-y-6 pt-6 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-3 tracking-tight"><ReceiptText className="h-5 w-5 text-[#006AFF]" /> Financial Records</h2>
            {!loading && hasPermission('invoices.create') && (
              <ActionButton title="Invoice" trigger={<Button><Plus className="h-4 w-4" /> New Invoice</Button>}><InvoiceForm projectId={id} onSuccess={loadData} /></ActionButton>
            )}
        </div>
        <div className="px-4 sm:px-0"><InvoiceList invoices={project.invoices || []} projectId={id} organisationName={project.organisations?.name} onRefresh={loadData} /></div>
      </section>

      {/* 2. PROJECT ANALYTICS SECTION - COLLAPSIBLE */}
      <Collapsible open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-[#006AFF]" />
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Project Analytics</h2>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {isAnalyticsOpen ? 'Hide Analytics' : 'View Analytics'}
              <ChevronRight className={`h-4 w-4 transition-transform ${isAnalyticsOpen ? 'rotate-90' : ''}`} />
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Milestone Progress Chart */}
            <div className="bg-white rounded-md border border-gray-200/50 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <PieChart className="h-5 w-5 text-[#006AFF]" />
                <h3 className="text-lg font-semibold">Milestone Progress</h3>
              </div>
              <ProjectMilestoneProgressChart phases={project.phases || []} />
            </div>

            {/* Phase Distribution Chart */}
            <div className="bg-white rounded-md border border-gray-200/50 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="h-5 w-5 text-[#006AFF]" />
                <h3 className="text-lg font-semibold">Phase Distribution</h3>
              </div>
              <ProjectPhaseDistributionChart phases={project.phases || []} />
            </div>

            {/* Budget Utilization Chart */}
            {project.budget && (
              <div className="bg-white rounded-md border border-gray-200/50 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="h-5 w-5 text-[#006AFF]" />
                  <h3 className="text-lg font-semibold">Budget Utilization</h3>
                </div>
                <ProjectBudgetUtilizationChart project={project} invoices={project.invoices || []} />
              </div>
            )}

            {/* Team Activity Chart */}
            <div className="bg-white rounded-md border border-gray-200/50 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="h-5 w-5 text-[#006AFF]" />
                <h3 className="text-lg font-semibold">Team Activity</h3>
              </div>
              <ProjectTeamActivityChart phases={project.phases || []} />
            </div>
          </div>

          {/* Project Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-md p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Phases</p>
                  <p className="text-2xl font-bold">{project.phases?.length || 0}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-md p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Milestones</p>
                  <p className="text-2xl font-bold">{project.phases?.reduce((sum: number, phase: any) => sum + (phase.milestones?.length || 0), 0) || 0}</p>
                </div>
                <PieChart className="h-8 w-8 text-green-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-md p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Team Members</p>
                  <p className="text-2xl font-bold">{project.project_members?.length || 0}</p>
                </div>
                <Activity className="h-8 w-8 text-purple-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-md p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Total Invoices</p>
                  <p className="text-2xl font-bold">{project.invoices?.length || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-200" />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>



      <div className="px-4 sm:px-0"><ProjectWiki projectId={id} title="Wiki" showHeader={true} /></div>
    </div>
  );
}