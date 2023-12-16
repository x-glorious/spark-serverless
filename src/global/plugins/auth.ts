import Jwt from 'jsonwebtoken'
import { Plugin } from '@/global/types/plugin'
import { getEnv } from '@/global/utils/env'
import { db } from '@/global/db'
import { JwtPayload } from '@/global/types/jwt'

export interface AuthPluginContext {
  user?: {
    id: string
  }
}

export const auth: Plugin = {
  run: async (req, res, context) => {
    const authorization = req.headers['x-authorization'] as string

    try {
      const { user, securityToken } = Jwt.verify(
        authorization,
        getEnv().JWT_KEY,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as unknown as JwtPayload

      const cacheSecurityToken = await db.oauth.securityToken.get(user.id)

      // check security token to disable abandoned jwt token
      if (cacheSecurityToken !== securityToken) {
        return res.status(401).end()
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      context.user = user as any

      return undefined
    } catch (_e) {
      // default
    }

    return res.status(401).end()
  },
}
