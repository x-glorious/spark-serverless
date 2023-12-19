import Jwt from 'jsonwebtoken'
import { nanoid } from 'nanoid'
import { db } from '@/global/db'
import { getEnv } from '@/global/utils/env'
import { JwtPayload } from '../types/jwt'

export const generateJwt = async (id: string) => {
  // set/refresh securityToken
  const securityToken = nanoid()

  await db.oauth.securityToken.set(id, securityToken)

  const payload = {
    user: {
      id,
    },
    securityToken,
  }

  const authToken = Jwt.sign(payload, getEnv().JWT_KEY, { expiresIn: '3d' })

  const refreshToken = Jwt.sign(payload, getEnv().JWT_KEY, { expiresIn: '7d' })

  return {
    authToken,
    refreshToken,
  }
}

export const getJwtPayload = async (jwt: string) => {
  const { user, securityToken } = Jwt.verify(
    jwt,
    getEnv().JWT_KEY,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as unknown as JwtPayload

  const cacheSecurityToken = await db.oauth.securityToken.get(user.id)

  // check security token to disable abandoned jwt token
  if (cacheSecurityToken !== securityToken) {
    throw new Error()
  }

  return user
}
