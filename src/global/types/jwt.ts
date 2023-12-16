export interface JwtPayload {
  user: {
    id: string
  }
  securityToken: string
}
