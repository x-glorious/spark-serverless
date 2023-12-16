import { handlerBuilder } from '@/global/utils/handler-builder'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { auth } from '@/global/plugins/auth'
import { PluginContext } from '@/global/types/plugin'
import { cors } from '@/global/plugins/cors'
import { db } from '@/global/db'

async function handler(
  req: VercelRequest,
  res: VercelResponse,
  context: PluginContext,
) {
  // clear securityToken to disable old jwt token
  const result = await db.oauth.securityToken.set(context.user!.id, '')

  return res.status(result ? 200 : 500).end()
}

export default handlerBuilder(handler, [cors, auth])
