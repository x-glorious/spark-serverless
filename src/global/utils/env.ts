export enum RuntimeEnv {
  dev = 'development',
  pro = 'production',
}

export interface Env {
  OAUTH_GITHUB_CLIENT_ID: string
  OAUTH_GITHUB_CLIENT_SECRET: string
  VERCEL_ENV: RuntimeEnv
  JWT_KEY: string
}

export const getEnv = () => process.env as unknown as Env
