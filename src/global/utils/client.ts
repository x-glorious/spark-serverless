import { RuntimeEnv, getEnv } from './env'

export const clientHost = getEnv().VERCEL_ENV === RuntimeEnv.dev ? 'http://localhost:22333' : 'https://spark-sea.vercel.app'
