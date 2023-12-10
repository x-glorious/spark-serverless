import { Plugin } from "@/global/types/plugin";

export const cors: Plugin = {
  run: async (req, res, context) => {
    console.log(req.method)
    if (req.method === 'OPTIONS') {
      return res.status(200).send('ok')
    }

    return undefined
  }
}
