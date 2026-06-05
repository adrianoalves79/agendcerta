import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ivfpjjfutbhjsctwuesq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZnBqamZ1dGJoanNjdHd1ZXNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NjY1MzUsImV4cCI6MjA5NjI0MjUzNX0.DH-hRrxzUNZXbwPPV2bLSCxNbGj1YEMXIf_jEUq2HQY'

export const supabase = createClient(supabaseUrl, supabaseKey)
