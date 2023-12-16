import { kv } from '@vercel/kv'
import { kvKey } from './kv-key'

export enum DbAuthScope {
  /**
   * user id -> securityToken
   */
  securityToken = 'security-token',
}

const getKey = (scope: DbAuthScope, ...args: string[]) => {
  return kvKey(['oauth', scope, ...args])
}

const securityToken = {
  set: async (userId: string, token: string) => {
    return await kv.set(getKey(DbAuthScope.securityToken, userId), token)
  },
  get: async (userId: string) => {
    return await kv.get(getKey(DbAuthScope.securityToken, userId))
  },
}

export const oauth = {
  securityToken,
}
