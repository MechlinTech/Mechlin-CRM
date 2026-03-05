"use client"

import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js'
import { Bar, Pie, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
)

interface ProjectMilestoneProgressChartProps {
  phases: any[]
}

export function ProjectMilestoneProgressChart({ phases }: ProjectMilestoneProgressChartProps) {
  const milestoneData = phases.reduce((acc: any, phase: any) => {
    if (phase.milestones) {
      phase.milestones.forEach((milestone: any) => {
        const status = milestone.status || 'unknown'
        acc[status] = (acc[status] || 0) + 1
      })
    }
    return acc
  }, {})

  const data = {
    labels: Object.keys(milestoneData).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    datasets: [
      {
        label: 'Milestone Status',
        data: Object.values(milestoneData),
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#6B7280'],
        borderColor: ['#059669', '#D97706', '#DC2626', '#4B5563'],
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Milestone Progress',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
    },
  }

  return (
    <div className="h-80">
      <Pie data={data} options={options} />
    </div>
  )
}

interface ProjectPhaseDistributionChartProps {
  phases: any[]
}

export function ProjectPhaseDistributionChart({ phases }: ProjectPhaseDistributionChartProps) {
  const phaseMilestoneCounts = phases.map((phase: any) => ({
    name: phase.name.length > 20 ? phase.name.substring(0, 20) + '...' : phase.name,
    milestoneCount: phase.milestones?.length || 0,
  }))

  const data = {
    labels: phaseMilestoneCounts.map(p => p.name),
    datasets: [
      {
        label: 'Milestones per Phase',
        data: phaseMilestoneCounts.map(p => p.milestoneCount),
        backgroundColor: '#006AFF',
        borderColor: '#0056CC',
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Phase Distribution',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        }
      }
    }
  }

  return (
    <div className="h-80">
      <Bar data={data} options={options} />
    </div>
  )
}

interface ProjectBudgetUtilizationChartProps {
  project: any
  invoices: any[]
}

export function ProjectBudgetUtilizationChart({ project, invoices }: ProjectBudgetUtilizationChartProps) {
  const totalInvoiced = invoices.reduce((sum: number, invoice: any) => {
    return sum + (invoice.amount || 0)
  }, 0)

  const remainingBudget = (project.budget || 0) - totalInvoiced
  const utilizationRate = project.budget ? (totalInvoiced / project.budget) * 100 : 0

  const data = {
    labels: ['Budget Utilization'],
    datasets: [
      {
        label: 'Spent',
        data: [totalInvoiced],
        backgroundColor: '#10B981',
        borderColor: '#059669',
        borderWidth: 1,
      },
      {
        label: 'Remaining',
        data: [Math.max(0, remainingBudget)],
        backgroundColor: '#F59E0B',
        borderColor: '#D97706',
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: `Budget Utilization (${utilizationRate.toFixed(1)}%)`,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return (project.currency || '$') + value.toLocaleString()
          }
        }
      }
    }
  }

  return (
    <div className="h-80">
      <Bar data={data} options={options} />
    </div>
  )
}

interface ProjectTeamActivityChartProps {
  phases: any[]
}

export function ProjectTeamActivityChart({ phases }: ProjectTeamActivityChartProps) {
  const activityData = phases.reduce((acc: any, phase: any) => {
    if (phase.milestones) {
      phase.milestones.forEach((milestone: any) => {
        if (milestone.sprints) {
          milestone.sprints.forEach((sprint: any) => {
            const status = sprint.status || 'unknown'
            acc[status] = (acc[status] || 0) + 1
          })
        }
      })
    }
    return acc
  }, {})

  const data = {
    labels: Object.keys(activityData).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    datasets: [
      {
        label: 'Sprint Status',
        data: Object.values(activityData),
        backgroundColor: ['#006AFF', '#10B981', '#F59E0B', '#EF4444'],
        borderColor: ['#0056CC', '#059669', '#D97706', '#DC2626'],
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Team Activity (Sprints)',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
    },
  }

  return (
    <div className="h-80">
      <Pie data={data} options={options} />
    </div>
  )
}

interface ProjectTimelineChartProps {
  phases: any[]
}

export function ProjectTimelineChart({ phases }: ProjectTimelineChartProps) {
  const timelineData = phases.map((phase: any) => ({
    name: phase.name.length > 15 ? phase.name.substring(0, 15) + '...' : phase.name,
    milestoneCount: phase.milestones?.length || 0,
    completedMilestones: phase.milestones?.filter((m: any) => m.status === 'completed').length || 0,
  }))

  const data = {
    labels: timelineData.map(p => p.name),
    datasets: [
      {
        label: 'Completed Milestones',
        data: timelineData.map(p => p.completedMilestones),
        backgroundColor: '#10B981',
        borderColor: '#059669',
        borderWidth: 1,
      },
      {
        label: 'Total Milestones',
        data: timelineData.map(p => p.milestoneCount),
        backgroundColor: '#006AFF',
        borderColor: '#0056CC',
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Project Timeline Progress',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        }
      }
    }
  }

  return (
    <div className="h-80">
      <Bar data={data} options={options} />
    </div>
  )
}
