"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

/**
 * Supabase client for Server Actions (Next 16 safe)
 */
async function createActionClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {}
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options })
          } catch {}
        },
      },
    }
  )
}

/**
 * Audit logger
 */
async function logAuditEvent(
  supabase: Awaited<ReturnType<typeof createActionClient>>,
  targetId: string,
  targetType: "project" | "milestone" | "sprint" | "document",
  actionType: string,
  newValue: any,
  oldValue: any = null
) {
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth?.user?.id ?? null

  const { error } = await supabase.from("status_logs").insert([
    {
      target_id: targetId,
      target_type: targetType,
      action_type: actionType,
      old_value: oldValue,
      new_value: newValue,
      changed_by: userId,
    },
  ])

  if (error) console.error("status_logs insert failed:", error.message)
}

/* =========================================================
   PHASE CRUD
========================================================= */

export async function createPhaseAction(projectId: string, name: string) {
  const supabase = await createActionClient()

  const { data: phase, error } = await supabase
    .from("phases")
    .insert([{ project_id: projectId, name }])
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  await logAuditEvent(supabase, projectId, "project", "PHASE_CREATED", {
    details: `Phase "${name}" was created.`,
    phase_id: phase.id,
  })

  revalidatePath(`/projects/${projectId}`)
  return { success: true, data: phase }
}

export async function updatePhaseAction(phaseId: string, projectId: string, name: string) {
  const supabase = await createActionClient()

  const { data: oldPhase } = await supabase.from("phases").select("*").eq("id", phaseId).single()

  const { error } = await supabase.from("phases").update({ name }).eq("id", phaseId)
  if (error) return { success: false, error: error.message }

  await logAuditEvent(
    supabase,
    projectId,
    "project",
    "PHASE_UPDATED",
    { details: `Phase updated to "${name}"`, phase_id: phaseId },
    oldPhase
  )

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function deletePhaseAction(phaseId: string, projectId: string) {
  const supabase = await createActionClient()

  const { data: oldPhase } = await supabase.from("phases").select("*").eq("id", phaseId).single()

  const { error } = await supabase.from("phases").delete().eq("id", phaseId)
  if (error) return { success: false, error: error.message }

  await logAuditEvent(
    supabase,
    projectId,
    "project",
    "PHASE_DELETED",
    { details: `A project phase was removed.`, phase_id: phaseId },
    oldPhase
  )

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

/* =========================================================
   MILESTONE CRUD
========================================================= */

export async function createMilestoneAction(phaseId: string, projectId: string, data: any) {
  const supabase = await createActionClient()

  const { data: milestone, error } = await supabase
    .from("milestones")
    .insert([{ ...data, phase_id: phaseId }])
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  // milestone-level log
  await logAuditEvent(supabase, milestone.id, "milestone", "MILESTONE_CREATED", {
    details: `Milestone "${milestone.name}" initialized.`,
  })

  // project-level log (so it appears in project history)
  await logAuditEvent(supabase, projectId, "project", "MILESTONE_CREATED", {
    details: `Milestone "${milestone.name}" initialized.`,
    milestone_id: milestone.id,
    phase_id: phaseId,
  })

  revalidatePath(`/projects/${projectId}`)
  return { success: true, data: milestone }
}

export async function updateMilestoneAction(milestoneId: string, projectId: string, data: any) {
  const supabase = await createActionClient()

  const { data: oldMilestone } = await supabase
    .from("milestones")
    .select("*")
    .eq("id", milestoneId)
    .single()

  const { error } = await supabase.from("milestones").update(data).eq("id", milestoneId)
  if (error) return { success: false, error: error.message }

  await logAuditEvent(
    supabase,
    milestoneId,
    "milestone",
    "MILESTONE_UPDATED",
    { details: `Milestone "${data?.name ?? oldMilestone?.name}" updated.` },
    oldMilestone
  )

  await logAuditEvent(
    supabase,
    projectId,
    "project",
    "MILESTONE_UPDATED",
    { details: `Milestone "${data?.name ?? oldMilestone?.name}" updated.`, milestone_id: milestoneId },
    oldMilestone
  )

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function deleteMilestoneAction(milestoneId: string, projectId: string) {
  const supabase = await createActionClient()

  const { data: oldMilestone } = await supabase
    .from("milestones")
    .select("*")
    .eq("id", milestoneId)
    .single()

  const { error } = await supabase.from("milestones").delete().eq("id", milestoneId)
  if (error) return { success: false, error: error.message }

  await logAuditEvent(
    supabase,
    milestoneId,
    "milestone",
    "MILESTONE_DELETED",
    { details: `A milestone was removed.` },
    oldMilestone
  )

  await logAuditEvent(
    supabase,
    projectId,
    "project",
    "MILESTONE_DELETED",
    { details: `A milestone was removed.`, milestone_id: milestoneId },
    oldMilestone
  )

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

/* =========================================================
   SPRINT CRUD
========================================================= */

export async function createSprintAction(milestoneId: string, projectId: string, data: any) {
  const supabase = await createActionClient()

  const { data: sprint, error } = await supabase
    .from("sprints")
    .insert([{ ...data, milestone_id: milestoneId }])
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  await logAuditEvent(supabase, sprint.id, "sprint", "SPRINT_CREATED", {
    details: `New sprint "${sprint.name}" added.`,
  })

  await logAuditEvent(supabase, projectId, "project", "SPRINT_CREATED", {
    details: `New sprint "${sprint.name}" added.`,
    sprint_id: sprint.id,
    milestone_id: milestoneId,
  })

  revalidatePath(`/projects/${projectId}`)
  return { success: true, data: sprint }
}

export async function updateSprintAction(sprintId: string, projectId: string, data: any) {
  const supabase = await createActionClient()

  const { data: oldSprint } = await supabase.from("sprints").select("*").eq("id", sprintId).single()

  const { error } = await supabase.from("sprints").update(data).eq("id", sprintId)
  if (error) return { success: false, error: error.message }

  await logAuditEvent(
    supabase,
    sprintId,
    "sprint",
    "SPRINT_UPDATED",
    { details: `Sprint "${data?.name ?? oldSprint?.name}" updated.` },
    oldSprint
  )

  await logAuditEvent(
    supabase,
    projectId,
    "project",
    "SPRINT_UPDATED",
    { details: `Sprint "${data?.name ?? oldSprint?.name}" updated.`, sprint_id: sprintId },
    oldSprint
  )

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function deleteSprintAction(sprintId: string, projectId: string) {
  const supabase = await createActionClient()

  const { data: oldSprint } = await supabase.from("sprints").select("*").eq("id", sprintId).single()

  const { error } = await supabase.from("sprints").delete().eq("id", sprintId)
  if (error) return { success: false, error: error.message }

  await logAuditEvent(
    supabase,
    sprintId,
    "sprint",
    "SPRINT_DELETED",
    { details: `A sprint was removed.` },
    oldSprint
  )

  await logAuditEvent(
    supabase,
    projectId,
    "project",
    "SPRINT_DELETED",
    { details: `A sprint was removed.`, sprint_id: sprintId },
    oldSprint
  )

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

/* =========================================================
   TASK CRUD
   NOTE: status_logs.target_type does NOT allow 'task'
   So tasks are logged under project target_type.
========================================================= */

export async function createTaskAction(data: any) {
  const supabase = await createActionClient()

  const { data: task, error } = await supabase.from("tasks").insert([data]).select().single()
  if (error) return { success: false, error: error.message }

  await logAuditEvent(supabase, data.project_id, "project", "TASK_CREATED", {
    details: `Task "${task.title}" was created.`,
    task_id: task.id,
    sprint_id: task.sprint_id,
    milestone_id: task.milestone_id,
    phase_id: task.phase_id,
  })

  revalidatePath(`/projects/${data.project_id}`)
  return { success: true, data: task }
}

export async function updateTaskAction(taskId: string, projectId: string, data: any) {
  const supabase = await createActionClient()

  const { data: oldTask } = await supabase.from("tasks").select("*").eq("id", taskId).single()

  const { error } = await supabase.from("tasks").update(data).eq("id", taskId)
  if (error) return { success: false, error: error.message }

  await logAuditEvent(
    supabase,
    projectId,
    "project",
    "TASK_UPDATED",
    { details: `Task "${data?.title ?? oldTask?.title}" updated.`, task_id: taskId },
    oldTask
  )

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function deleteTaskAction(taskId: string, projectId: string) {
  const supabase = await createActionClient()

  const { data: oldTask } = await supabase.from("tasks").select("*").eq("id", taskId).single()

  const { error } = await supabase.from("tasks").delete().eq("id", taskId)
  if (error) return { success: false, error: error.message }

  await logAuditEvent(
    supabase,
    projectId,
    "project",
    "TASK_DELETED",
    { details: `A task was removed.`, task_id: taskId },
    oldTask
  )

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}
