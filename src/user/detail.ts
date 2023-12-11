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
  return res.json(
    await db.user.detail.get(context.user!.platform, context.user!.identifier),
  )
}

export default handlerBuilder(handler, [cors, auth])
