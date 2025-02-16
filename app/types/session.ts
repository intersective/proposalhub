export interface Session {
    user: {
      id: string
      organizationId?: string
      email?: string | null
      name?: string | null
      image?: string | null
    }
}