import { nanoid } from 'nanoid';
import axios from 'axios';
import Jwt from 'jsonwebtoken';
import { kv } from '@vercel/kv';
import Qs from 'qs';

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
const getKey = (scope, ...args) => {
    return kvKey(['user', scope, ...args]);
};
const oauth = {
    get: async (platform, identifier) => {
        return await kv.get(getKey(DbUserScope.oauth, platform, identifier));
    },
    set: async (platform, identifier, value) => {
        return await kv.set(getKey(DbUserScope.oauth, platform, identifier), value);
    },
};
const detail = {
    get: async (id) => {
        return await kv.get(getKey(DbUserScope.detail, id));
    },
    set: async (id, value) => {
        return await kv.set(getKey(DbUserScope.detail, id), value);
    },
};
// todo oauth:platform:id -> nanoid(), user info
const user = {
    oauth,
    detail,
};

const db = Object.freeze({
    user,
});

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
    const { platform, code, back_to } = req.query;
    let userBrief;
    if (platform === OauthPlatform.github) {
        userBrief = await getGithubUser(code);
    }
    let id = await db.user.oauth.get(userBrief.platform, userBrief.platformIdentifier);
    if (!id) {
        id = nanoid();
        await db.user.detail.set(id, {
            ...userBrief,
            id,
        });
    }
    const token = Jwt.sign({
        user: {
            id,
        },
    }, getEnv().JWT_KEY);
    const redirectUrl = `${clientHost}/user/login?` +
        Qs.stringify({
            back: back_to,
            token,
        });
    return res.redirect(redirectUrl);
}

export { handler as default };
