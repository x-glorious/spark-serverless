import { handlerBuilder } from '@/global/utils/handler-builder'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { auth } from '@/global/plugins/auth'
import { PluginContext } from '@/global/types/plugin'

async function handler(req: VercelRequest, res: VercelResponse, context: PluginContext) {
  return res.json(context)
}

export default handlerBuilder(handler, [auth])
