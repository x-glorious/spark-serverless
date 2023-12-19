import { handlerBuilder } from '@/global/utils/handler-builder'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { cors } from '@/global/plugins/cors'
import { generateJwt, getJwtPayload } from '@/global/utils/jwt'

async function handler(req: VercelRequest, res: VercelResponse) {
  const refresh = req.headers['x-authorization-refresh'] as string

  try {
    const user = await getJwtPayload(refresh)
    // regenerate token
    const { authToken, refreshToken } = await generateJwt(user.id)

    return res.json({
      authToken,
      refreshToken,
    })
  } catch (_e) {
    // default
  }

  return res.status(401).end()
}

export default handlerBuilder(handler, [cors])
