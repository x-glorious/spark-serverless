import type { VercelRequest, VercelResponse } from '@vercel/node'
import { OauthPlatform } from '@/global/types/oauth'
import { nanoid } from 'nanoid'
import axios from 'axios'
import { getEnv } from '@/global/utils/env'
import { clientHost } from '@/global/utils/client'
import { UserDetail } from '@/global/db/user'
import { db } from '@/global/db'
import Qs from 'qs'
import { generateJwt } from '@/global/utils/jwt'

const getGithubUser = async (code: string): Promise<Omit<UserDetail, 'id'>> => {
  const tokenResponse = await axios({
    method: 'post',
    url:
      'https://github.com/login/oauth/access_token?' +
      Qs.stringify({
        client_id: getEnv().OAUTH_GITHUB_CLIENT_ID,
        client_secret: getEnv().OAUTH_GITHUB_CLIENT_SECRET,
        code,
      }),
    headers: {
      accept: 'application/json',
    },
  })

  const accessToken = tokenResponse.data.access_token

  const userResponse = await axios({
    method: 'get',
    url: `https://api.github.com/user`,
    headers: {
      accept: 'application/json',
      Authorization: `token ${accessToken}`,
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { id, name, avatar_url } = userResponse.data as any

  const emailResult = await axios({
    method: 'get',
    url: `https://api.github.com/user/emails`,
    headers: {
      accept: 'application/json',
      Authorization: `token ${accessToken}`,
    },
  })

  const { email = '' } =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emailResult.data.find((item: any) => item.primary) || {}

  return {
    platformIdentifier: id,
    name,
    avatar: avatar_url,
    email,
    platform: OauthPlatform.github,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { platform, code } = req.query

  let userBrief: Omit<UserDetail, 'id'> | undefined

  if (platform === OauthPlatform.github) {
    userBrief = await getGithubUser(code as string)
  }

  let id = await db.user.oauth.get(
    userBrief!.platform,
    userBrief!.platformIdentifier,
  )

  if (!id) {
    id = nanoid()
    // save oauth link to id
    await db.user.oauth.set(
      userBrief!.platform,
      userBrief!.platformIdentifier,
      id,
    )
    // save user detail
    await db.user.detail.set(id, {
      ...userBrief!,
      id,
    })
  }

  const { authToken, refreshToken } = await generateJwt(id)

  const redirectUrl =
    `${clientHost}/oauth/callback?` +
    Qs.stringify({
      ['auth-token']: authToken,
      ['refresh-token']: refreshToken,
    })

  return res.redirect(redirectUrl)
}
