import { Plugin } from '@/global/types/plugin'
import { OAuthContext } from '../types/oauth'
import { getJwtPayload } from '../utils/jwt'

export type AuthPluginContext = OAuthContext

export const auth: Plugin = {
  run: async (req, res, context) => {
    const authorization = req.headers['x-authorization'] as string

    try {
      const user = await getJwtPayload(authorization)
      context.user = user

      return undefined
    } catch (_e) {
      // default
    }

    return res.status(401).end()
  },
}
