import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sxxrayfrdqfmzgekpzga.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4eHJheWZyZHFmbXpnZWtwemdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NDE3ODIsImV4cCI6MjA3NDExNzc4Mn0.D6s1XOf5W1nw-_-bnASuyR9hFsHFRAi6opS8Qi_d_JI'

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface TLDRData {
  id?: number
  created_at?: string
  data: {
    title: string
    sentiment: number
    highlights: Array<{
      text: string
      highlightedword: Array<{
        word: string
        direction: 'up' | 'down' | 'neutral'
      }>
    }>
    big_picture: Array<{
      text: string
      highlightedword: Array<{
        word: string
        direction: 'up' | 'down' | 'neutral'
      }>
    }>
  }
  source: string
}
