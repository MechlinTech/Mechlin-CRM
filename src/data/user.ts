import { supabase } from '@/lib/supabase'

export async function getUserById(userId: string) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', userId)
            .single()

        return { data, error }
    } catch (error) {
        return { data: null, error: (error as any)?.message || 'Failed to fetch user' }
    }
}
