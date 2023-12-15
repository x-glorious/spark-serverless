import { handlerBuilder } from '@/global/utils/handler-builder'
import { omit } from 'lodash-es'
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
  const result = await db.user.detail.get(context.user!.id)

  return result
    ? res.json(omit(result, ['platformIdentifier']))
    : res.status(401).end()
}

export default handlerBuilder(handler, [cors, auth])
