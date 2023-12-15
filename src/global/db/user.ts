import { kv } from '@vercel/kv'
import { OauthPlatform } from '@/global/types/oauth'
import { kvKey } from './kv-key'

export enum DbUserScope {
  /**
   * oauth map
   * platform:identifier -> token
   */
  oauth = 'oauth',
  /**
   * detail of user
   */
  detail = 'detail',
}

export interface UserDetail {
  id: string
  name: string
  avatar?: string
  email: string
  platform: OauthPlatform
  platformIdentifier: string
}

const getKey = (scope: DbUserScope, ...args: string[]) => {
  return kvKey(['user', scope, ...args])
}

const oauth = {
  get: async (platform: OauthPlatform, identifier: string) => {
    return await kv.get<string>(getKey(DbUserScope.oauth, platform, identifier))
  },
  set: async (platform: OauthPlatform, identifier: string, value: string) => {
    return await kv.set(getKey(DbUserScope.oauth, platform, identifier), value)
  },
}

const detail = {
  get: async (id: string) => {
    return await kv.get<UserDetail>(getKey(DbUserScope.detail, id))
  },
  set: async (id: string, value: UserDetail) => {
    return await kv.set(getKey(DbUserScope.detail, id), value)
  },
}

// todo oauth:platform:id -> nanoid(), user info

export const user = {
  oauth,
  detail,
}
