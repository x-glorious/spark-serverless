import type { VercelRequest, VercelResponse } from '@vercel/node'
import { AuthPluginContext } from '@/global/plugins/auth'

export type PluginContext = AuthPluginContext

export interface Plugin {
  run?: (
    req: VercelRequest,
    res: VercelResponse,
    context: PluginContext,
  ) => Promise<VercelResponse | void | undefined>
  after?: (
    req: VercelRequest,
    res: VercelResponse,
    context: PluginContext,
  ) => Promise<VercelResponse>
}
