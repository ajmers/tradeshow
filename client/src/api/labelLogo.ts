import { supabase } from '@/lib/supabase'

export async function fetchLabelLogo(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return null
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('label_logo_data_url')
    .eq('id', session.user.id)
    .single()
  if (error) {
    throw new Error(`Failed to fetch label logo: ${error.message}`)
  }
  return data.label_logo_data_url
}

export async function updateLabelLogo(dataUrl: string | null): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Not signed in')
  }
  const { error } = await supabase
    .from('profiles')
    .update({ label_logo_data_url: dataUrl })
    .eq('id', session.user.id)
  if (error) {
    throw new Error(`Failed to update label logo: ${error.message}`)
  }
}
