import type { VercelRequest, VercelResponse } from '@vercel/node'
import { OauthPlatform } from '@/global/types/oauth'
import axios from 'axios'
import Jwt from 'jsonwebtoken'
import { getEnv } from '@/global/utils/env'
import { clientHost } from '@/global/utils/client'
import { UserDetail } from '@/global/db/user'
import { db } from '@/global/db'

const getGithubUser = async (code: string): Promise<UserDetail> => {
  const tokenResponse = await axios({
    method: 'post',
    url:
      'https://github.com/login/oauth/access_token?' +
      `client_id=${getEnv().OAUTH_GITHUB_CLIENT_ID}&` +
      `client_secret=${getEnv().OAUTH_GITHUB_CLIENT_SECRET}&` +
      `code=${code}`,
    headers: {
      accept: 'application/json',
    },
  })

  const accessToken = tokenResponse.data.access_token

  const result = await axios({
    method: 'get',
    url: `https://api.github.com/user`,
    headers: {
      accept: 'application/json',
      Authorization: `token ${accessToken}`,
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { id, name, avatar_url } = result.data as any

  return {
    identifier: id,
    name,
    avatar: avatar_url,
    platform: OauthPlatform.github,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { platform, code, back_to } = req.query

  let userBrief: UserDetail | undefined

  if (platform === OauthPlatform.github) {
    userBrief = await getGithubUser(code as string)
  }

  const cacheBrief = await db.user.detail.get(
    userBrief!.platform,
    userBrief!.identifier,
  )

  // do not have any cache
  if (!cacheBrief) {
    await db.user.detail.set(
      userBrief!.platform,
      userBrief!.identifier,
      userBrief!,
    )
  }

  const token = Jwt.sign(
    {
      user: {
        identifier: userBrief?.identifier,
        platform,
      },
    },
    getEnv().JWT_KEY,
  )

  const redirectUrl =
    clientHost +
    '/user/login' +
    `?back=${decodeURIComponent(back_to as string)}` +
    `&token=${token}`

  return res.redirect(redirectUrl)
}
