import { Plugin } from "@/global/types/plugin";

export const cors: Plugin = {
  run: async (req, res, context) => {

    console.error('enter')
    const headers = [
      { "key": "Access-Control-Allow-Credentials", "value": "true" },
      { "key": "Access-Control-Allow-Origin", "value": "*" },
      { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
      { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" }
    ]

    headers.forEach(({key, value}) => res.setHeader(key, value))

    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    return undefined
  }
}
