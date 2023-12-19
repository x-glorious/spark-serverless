import { OAuthContext } from './oauth'

export interface JwtPayload extends Required<OAuthContext> {
  securityToken: string
}
