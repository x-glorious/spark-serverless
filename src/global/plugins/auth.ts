import Jwt from 'jsonwebtoken'
import { Plugin } from "@/global/types/plugin";
import { getEnv } from '@/global/utils/env';
import { OauthPlatform } from '@/global/types/oauth';

export interface AuthPluginContext {
  user?: {
    identifier: string
    platform: OauthPlatform
  }
}

export const auth: Plugin = {
  run: async (req, res, context) => {
    const { authorization } = req.cookies

    try {
      const { user } = Jwt.verify(authorization, getEnv().JWT_KEY) as any
      context.user = user as any

      return undefined
    }catch(_e) {

    }

    console.error('222')
    return res.status(401).send('unauthorized')
  }
}
