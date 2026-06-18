export interface Profile {
  id: string
  username?: string
  full_name?: string
  avatar_url?: string
  department?: string
  position?: string
  updated_at?: string
  is_admin?: boolean
  is_active?: boolean
  card_permissions?: Record<string, boolean>
}

