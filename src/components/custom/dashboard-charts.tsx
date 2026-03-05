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

interface UserDistributionChartProps {
  mechlinUsers: number
  otherUsers: number
}

export function UserDistributionChart({ mechlinUsers, otherUsers }: UserDistributionChartProps) {
  const data = {
    labels: ['Mechlin Team', 'External Users'],
    datasets: [
      {
        label: 'User Distribution',
        data: [mechlinUsers, otherUsers],
        backgroundColor: ['#006AFF', '#10B981'],
        borderColor: ['#0056CC', '#059669'],
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
        text: 'User Distribution',
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

interface OrganisationStatusChartProps {
  organisations: any[]
}

export function OrganisationStatusChart({ organisations }: OrganisationStatusChartProps) {
  // Count organisations by status
  const statusCounts = organisations.reduce((acc: any, org: any) => {
    const status = org.status || 'unknown'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  // Ensure all possible statuses are shown, even with zero count
  const allStatuses = ['active', 'trial', 'suspended']
  const finalCounts = allStatuses.reduce((acc: any, status: string) => {
    acc[status] = statusCounts[status] || 0
    return acc
  }, {})

  const data = {
    labels: ['Count'],
    datasets: [
      {
        label: 'Active',
        data: [finalCounts['active']],
        backgroundColor: '#10B981',
        borderColor: '#059669',
        borderWidth: 1,
      },
      {
        label: 'Trial',
        data: [finalCounts['trial']],
        backgroundColor: '#F59E0B',
        borderColor: '#D97706',
        borderWidth: 1,
      },
      {
        label: 'Suspended',
        data: [finalCounts['suspended']],
        backgroundColor: '#EF4444',
        borderColor: '#DC2626',
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
        text: 'Organisations by Status',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
    },
  }

  return (
    <div className="h-80">
      <Bar data={data} options={options} />
    </div>
  )
}

interface ProjectBudgetChartProps {
  projects: any[]
}

export function ProjectBudgetChart({ projects }: ProjectBudgetChartProps) {
  const projectsWithBudget = projects.filter(p => p.budget).slice(0, 10)
  
  const data = {
    labels: projectsWithBudget.map(p => p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name),
    datasets: [
      {
        label: 'Project Budget',
        data: projectsWithBudget.map(p => p.budget),
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
        text: 'Top Projects by Budget',
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
            return '$' + value.toLocaleString()
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

interface ProjectStatusChartProps {
  projects: any[]
}

export function ProjectStatusChart({ projects }: ProjectStatusChartProps) {
  const statusCounts = projects.reduce((acc: any, project: any) => {
    const status = project.status || 'unknown'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  const data = {
    labels: Object.keys(statusCounts).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    datasets: [
      {
        label: 'Projects by Status',
        data: Object.values(statusCounts),
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
        text: 'Projects by Status',
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

interface OrganisationGrowthChartProps {
  organisations: any[]
}

export function OrganisationGrowthChart({ organisations }: OrganisationGrowthChartProps) {
  const monthlyData = organisations.reduce((acc: any, org: any) => {
    if (org.created_at) {
      const date = new Date(org.created_at)
      const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      acc[monthYear] = (acc[monthYear] || 0) + 1
    }
    return acc
  }, {})

  const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime()
  })

  const cumulativeData: number[] = []
  let total = 0
  sortedMonths.forEach(month => {
    total += monthlyData[month]
    cumulativeData.push(total)
  })

  const data = {
    labels: sortedMonths,
    datasets: [
      {
        label: 'Cumulative Organisations',
        data: cumulativeData,
        borderColor: '#006AFF',
        backgroundColor: 'rgba(0, 106, 255, 0.1)',
        tension: 0.4,
        fill: true,
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
        text: 'Organisation Growth Over Time',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="h-80">
      <Line data={data} options={options} />
    </div>
  )
}
