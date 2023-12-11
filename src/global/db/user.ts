import { kv } from '@vercel/kv'
import { OauthPlatform } from '@/global/types/oauth'
import { kvKey } from './kv-key'

export enum DbUserScope {
  /**
   * detail of user
   */
  detail = 'detail',
}

export interface UserDetail {
  name: string
  avatar?: string
  platform: OauthPlatform
  identifier: string
}

const getKey = (
  scope: DbUserScope,
  platform: OauthPlatform,
  identifier: string,
) => {
  return kvKey(['user', scope, platform, identifier])
}

const detail = {
  get: async (platform: OauthPlatform, identifier: string) => {
    return await kv.get<UserDetail>(
      getKey(DbUserScope.detail, platform, identifier),
    )
  },
  set: async (
    platform: OauthPlatform,
    identifier: string,
    value: UserDetail,
  ) => {
    return await kv.set(getKey(DbUserScope.detail, platform, identifier), value)
  },
}

export const user = {
  detail,
}
