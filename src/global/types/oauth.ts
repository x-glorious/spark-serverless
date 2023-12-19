export enum OauthPlatform {
  github = 'github',
}

export interface OAuthContext {
  user: {
    id: string
  }
}
