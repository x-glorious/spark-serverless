import type { VercelRequest, VercelResponse } from '@vercel/node'
import { OauthPlatform } from '@/.global/types/.oauth'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { platform, code } = req.query
  console.error(req.query, OauthPlatform.github)

  return res.json({
    message: `Hello !`,
  })
}
