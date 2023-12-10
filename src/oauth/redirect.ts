import type { VercelRequest, VercelResponse } from '@vercel/node'
import { OauthPlatform } from '@/global/types/oauth'
import axios from 'axios';
import Jwt from 'jsonwebtoken'
import { getEnv } from '@/global/utils/env'
import Cookie from 'cookie'
import { clientHost } from '@/global/utils/client';

const getGithubUser = async (code: string) => {
  const tokenResponse = await axios({
    method: 'post',
    url: 'https://github.com/login/oauth/access_token?' +
      `client_id=${getEnv().OAUTH_GITHUB_CLIENT_ID}&` +
      `client_secret=${getEnv().OAUTH_GITHUB_CLIENT_SECRET}&` +
      `code=${code}`,
    headers: {
      accept: 'application/json'
    }
  })

  const accessToken = tokenResponse.data.access_token

  const result = await axios({
    method: 'get',
    url: `https://api.github.com/user`,
    headers: {
      accept: 'application/json',
      Authorization: `token ${accessToken}`
    }
  })

  return result.data.id
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { platform, code, back_to } = req.query

  let identifier: string | undefined

  if(platform === OauthPlatform.github) {
    identifier = await getGithubUser(code as string)
  }

  const token = Jwt.sign({
    user: {
      identifier,
      platform
    }
  }, getEnv().JWT_KEY)

  return res.setHeader(
    'Set-Cookie',
    Cookie.serialize('authorization', token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    })
  ).redirect(clientHost + decodeURIComponent(back_to as string))
}
