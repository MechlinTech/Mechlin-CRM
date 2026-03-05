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

interface OrgProjectStatusChartProps {
  projects: any[]
}

export function OrgProjectStatusChart({ projects }: OrgProjectStatusChartProps) {
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
        text: 'Project Status Distribution',
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

interface OrgBudgetChartProps {
  projects: any[]
}

export function OrgBudgetChart({ projects }: OrgBudgetChartProps) {
  const projectsWithBudget = projects.filter((p: any) => p.budget).slice(0, 10)
  
  const data = {
    labels: projectsWithBudget.map((p: any) => p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name),
    datasets: [
      {
        label: 'Project Budget',
        data: projectsWithBudget.map((p: any) => p.budget),
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
        text: 'Projects by Budget',
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

interface OrgTimelineChartProps {
  projects: any[]
}

export function OrgTimelineChart({ projects }: OrgTimelineChartProps) {
  const monthlyData = projects.reduce((acc: any, project: any) => {
    if (project.created_at) {
      const date = new Date(project.created_at)
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
        label: 'Cumulative Projects',
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
        text: 'Project Growth Over Time',
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

interface OrgActivityChartProps {
  projects: any[]
}

export function OrgActivityChart({ projects }: OrgActivityChartProps) {
  // Calculate project activity based on start dates and expected end dates
  const currentYear = new Date().getFullYear()
  const monthlyActivity = Array(12).fill(0)
  
  projects.forEach(project => {
    if (project.start_date) {
      const startDate = new Date(project.start_date)
      if (startDate.getFullYear() === currentYear) {
        const month = startDate.getMonth()
        monthlyActivity[month]++
      }
    }
  })

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const data = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Projects Started',
        data: monthlyActivity,
        backgroundColor: '#10B981',
        borderColor: '#059669',
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
        text: `Project Activity - ${currentYear}`,
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
          stepSize: 1
        }
      },
    },
  }

  return (
    <div className="h-80">
      <Bar data={data} options={options} />
    </div>
  )
}
