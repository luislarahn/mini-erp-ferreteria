import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyzpjwqhlbsnbskucamp.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5enBqd3FobGJzbmJza3VjYW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjc0NDQsImV4cCI6MjA4NDYwMzQ0NH0.ld-WN6x-AR6-2Usd9fGnsrXrxTtu6D_AI8dCkjFaiaA'

export const supabase = createClient(supabaseUrl, supabaseKey)

