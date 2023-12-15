import Jwt from 'jsonwebtoken'
import { Plugin } from '@/global/types/plugin'
import { getEnv } from '@/global/utils/env'

export interface AuthPluginContext {
  user?: {
    id: string
  }
}

export const auth: Plugin = {
  run: async (req, res, context) => {
    const authorization = req.headers['x-authorization'] as string

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { user } = Jwt.verify(authorization, getEnv().JWT_KEY) as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      context.user = user as any

      return undefined
    } catch (_e) {
      // default
    }

    return res.status(401).end()
  },
}
