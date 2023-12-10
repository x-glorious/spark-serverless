import { Plugin } from "@/global/types/plugin";

export const cors: Plugin = {
  run: async (req, res, context) => {

    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    return undefined
  }
}
