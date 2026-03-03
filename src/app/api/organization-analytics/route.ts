import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getUserWithOrganisation } from '@/actions/organisation-management'

export async function GET(request: NextRequest) {
  try {
    console.log('Analytics API: Starting request')
    
    // Create server-side Supabase client with cookies
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Analytics API: User auth error', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Analytics API: User authenticated:', user.id)

    // Get user's organization
    const userData = await getUserWithOrganisation(user.id)
    
    console.log('Analytics API: User data:', userData)
    
    if (!userData?.organisations) {
      console.error('Analytics API: No organization found for user:', user.id)
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const organizationId = userData.organisation_id
    const organization = userData.organisations

    console.log('Analytics API: Organization found:', organizationId)

    // Fetch organization analytics data
    const [
      projectsResult,
      usersResult
    ] = await Promise.all([
      // Get all projects for this organization
      supabase
        .from('projects')
        .select('*')
        .eq('organisation_id', organizationId)
        .order('created_at', { ascending: false }),
      
      // Get all users for this organization
      supabase
        .from('users')
        .select('*')
        .eq('organisation_id', organizationId)
        .order('created_at', { ascending: false })
    ])

    if (projectsResult.error) {
      console.error('Error fetching projects:', projectsResult.error)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    if (usersResult.error) {
      console.error('Error fetching users:', usersResult.error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    const projects = projectsResult.data || []
    const users = usersResult.data || []

    // Calculate analytics
    const analytics = {
      organization: {
        ...organization,
        total_projects: projects.length,
        total_users: users.length,
        active_projects: projects.filter(p => p.status === 'Active').length,
        pending_projects: projects.filter(p => p.status === 'Pending').length,
        suspended_projects: projects.filter(p => p.status === 'Suspended').length,
        total_budget: projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0),
        average_project_budget: projects.length > 0 
          ? projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0) / projects.length 
          : 0
      },
      projects: projects,
      users: users,
      charts: {
        project_status: {
          active: projects.filter(p => p.status === 'Active').length,
          pending: projects.filter(p => p.status === 'Pending').length,
          suspended: projects.filter(p => p.status === 'Suspended').length,
          other: projects.filter(p => !['Active', 'Pending', 'Suspended'].includes(p.status)).length
        },
        monthly_projects: calculateMonthlyProjects(projects),
        budget_distribution: calculateBudgetDistribution(projects),
        user_growth: calculateUserGrowth(users)
      }
    }

    console.log('Analytics API: Successfully generated analytics')
    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Analytics API: Error in organization analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateMonthlyProjects(projects: any[]) {
  const currentYear = new Date().getFullYear()
  const monthlyData = Array(12).fill(0)
  
  projects.forEach(project => {
    if (project.start_date) {
      const startDate = new Date(project.start_date)
      if (startDate.getFullYear() === currentYear) {
        const month = startDate.getMonth()
        monthlyData[month]++
      }
    }
  })

  return monthlyData
}

function calculateBudgetDistribution(projects: any[]) {
  const budgetRanges = {
    '0-10k': 0,
    '10k-50k': 0,
    '50k-100k': 0,
    '100k+': 0
  }

  projects.forEach(project => {
    const budget = Number(project.budget) || 0
    if (budget < 10000) {
      budgetRanges['0-10k']++
    } else if (budget < 50000) {
      budgetRanges['10k-50k']++
    } else if (budget < 100000) {
      budgetRanges['50k-100k']++
    } else {
      budgetRanges['100k+']++
    }
  })

  return budgetRanges
}

function calculateUserGrowth(users: any[]) {
  const monthlyData = users.reduce((acc: any, user: any) => {
    if (user.created_at) {
      const date = new Date(user.created_at)
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

  return {
    labels: sortedMonths,
    data: cumulativeData
  }
}
