import { nanoid } from 'nanoid';
import axios from 'axios';
import { kv } from '@vercel/kv';
import Qs from 'qs';
import Jwt from 'jsonwebtoken';

var OauthPlatform;
(function (OauthPlatform) {
    OauthPlatform["github"] = "github";
})(OauthPlatform || (OauthPlatform = {}));

var RuntimeEnv;
(function (RuntimeEnv) {
    RuntimeEnv["dev"] = "development";
    RuntimeEnv["pro"] = "production";
})(RuntimeEnv || (RuntimeEnv = {}));
const getEnv = () => process.env;

const clientHost = getEnv().VERCEL_ENV === RuntimeEnv.dev
    ? 'http://localhost:22333'
    : 'https://spark-sea.vercel.app';

const kvKey = (keys) => (typeof keys === 'string' ? [keys] : keys).join(':');

var DbUserScope;
(function (DbUserScope) {
    /**
     * oauth map
     * platform:identifier -> token
     */
    DbUserScope["oauth"] = "oauth";
    /**
     * detail of user
     */
    DbUserScope["detail"] = "detail";
})(DbUserScope || (DbUserScope = {}));
const getKey$1 = (scope, ...args) => {
    return kvKey(['user', scope, ...args]);
};
const oauth$1 = {
    get: async (platform, identifier) => {
        return await kv.get(getKey$1(DbUserScope.oauth, platform, identifier));
    },
    set: async (platform, identifier, value) => {
        return await kv.set(getKey$1(DbUserScope.oauth, platform, identifier), value);
    },
};
const detail = {
    get: async (id) => {
        return await kv.get(getKey$1(DbUserScope.detail, id));
    },
    set: async (id, value) => {
        return await kv.set(getKey$1(DbUserScope.detail, id), value);
    },
};
// todo oauth:platform:id -> nanoid(), user info
const user = {
    oauth: oauth$1,
    detail,
};

var DbAuthScope;
(function (DbAuthScope) {
    /**
     * user id -> securityToken
     */
    DbAuthScope["securityToken"] = "security-token";
})(DbAuthScope || (DbAuthScope = {}));
const getKey = (scope, ...args) => {
    return kvKey(['oauth', scope, ...args]);
};
const securityToken = {
    set: async (userId, token) => {
        return await kv.set(getKey(DbAuthScope.securityToken, userId), token);
    },
    get: async (userId) => {
        return await kv.get(getKey(DbAuthScope.securityToken, userId));
    },
};
const oauth = {
    securityToken,
};

const db = Object.freeze({
    user,
    oauth,
});

const generateJwt = async (id) => {
    // set/refresh securityToken
    const securityToken = nanoid();
    await db.oauth.securityToken.set(id, securityToken);
    const payload = {
        user: {
            id,
        },
        securityToken,
    };
    const authToken = Jwt.sign(payload, getEnv().JWT_KEY, { expiresIn: '3d' });
    const refreshToken = Jwt.sign(payload, getEnv().JWT_KEY, { expiresIn: '7d' });
    return {
        authToken,
        refreshToken,
    };
};

const getGithubUser = async (code) => {
    const tokenResponse = await axios({
        method: 'post',
        url: 'https://github.com/login/oauth/access_token?' +
            Qs.stringify({
                client_id: getEnv().OAUTH_GITHUB_CLIENT_ID,
                client_secret: getEnv().OAUTH_GITHUB_CLIENT_SECRET,
                code,
            }),
        headers: {
            accept: 'application/json',
        },
    });
    const accessToken = tokenResponse.data.access_token;
    const userResponse = await axios({
        method: 'get',
        url: `https://api.github.com/user`,
        headers: {
            accept: 'application/json',
            Authorization: `token ${accessToken}`,
        },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { id, name, avatar_url } = userResponse.data;
    const emailResult = await axios({
        method: 'get',
        url: `https://api.github.com/user/emails`,
        headers: {
            accept: 'application/json',
            Authorization: `token ${accessToken}`,
        },
    });
    const { email = '' } = 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emailResult.data.find((item) => item.primary) || {};
    return {
        platformIdentifier: id,
        name,
        avatar: avatar_url,
        email,
        platform: OauthPlatform.github,
    };
};
async function handler(req, res) {
    const { platform, code } = req.query;
    let userBrief;
    if (platform === OauthPlatform.github) {
        userBrief = await getGithubUser(code);
    }
    let id = await db.user.oauth.get(userBrief.platform, userBrief.platformIdentifier);
    if (!id) {
        id = nanoid();
        // save oauth link to id
        await db.user.oauth.set(userBrief.platform, userBrief.platformIdentifier, id);
        // save user detail
        await db.user.detail.set(id, {
            ...userBrief,
            id,
        });
    }
    const { authToken, refreshToken } = await generateJwt(id);
    const redirectUrl = `${clientHost}/oauth/callback?` +
        Qs.stringify({
            ['auth-token']: authToken,
            ['refresh-token']: refreshToken,
        });
    return res.redirect(redirectUrl);
}

export { handler as default };
