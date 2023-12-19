import { Plugin, PluginContext } from '@/global/types/plugin'
import { VercelRequest, VercelResponse } from '@vercel/node'

export const handlerBuilder = (
  handler: (
    req: VercelRequest,
    res: VercelResponse,
    context: PluginContext,
  ) => Promise<VercelResponse>,
  plugins: Plugin[],
) => {
  return async (req: VercelRequest, res: VercelResponse) => {
    const tasks = [...plugins, { run: handler }]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const context = {} as any
    let stopIndex = -1
    let result: VercelResponse = res

    // forward
    for (const task of tasks) {
      const taskResult = await task.run?.(req, res, context)

      if (taskResult) {
        stopIndex++
        result = taskResult
        break
      }
    }

    // backward
    for (const task of tasks.slice(0, stopIndex).reverse()) {
      const taskResult = await task.after?.(req, result, context)

      if (taskResult) {
        result = taskResult
      }
    }

    return result
  }
}
