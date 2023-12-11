import axios from 'axios';
import Jwt from 'jsonwebtoken';
import { kv } from '@vercel/kv';

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
     * detail of user
     */
    DbUserScope["detail"] = "detail";
})(DbUserScope || (DbUserScope = {}));
const getKey = (scope, platform, identifier) => {
    return kvKey(['user', scope, platform, identifier]);
};
const detail = {
    get: async (platform, identifier) => {
        return await kv.get(getKey(DbUserScope.detail, platform, identifier));
    },
    set: async (platform, identifier, value) => {
        return await kv.set(getKey(DbUserScope.detail, platform, identifier), value);
    },
};
const user = {
    detail,
};

const db = Object.freeze({
    user,
});

const getGithubUser = async (code) => {
    const tokenResponse = await axios({
        method: 'post',
        url: 'https://github.com/login/oauth/access_token?' +
            `client_id=${getEnv().OAUTH_GITHUB_CLIENT_ID}&` +
            `client_secret=${getEnv().OAUTH_GITHUB_CLIENT_SECRET}&` +
            `code=${code}`,
        headers: {
            accept: 'application/json',
        },
    });
    const accessToken = tokenResponse.data.access_token;
    const result = await axios({
        method: 'get',
        url: `https://api.github.com/user`,
        headers: {
            accept: 'application/json',
            Authorization: `token ${accessToken}`,
        },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { id, name, avatar_url } = result.data;
    return {
        identifier: id,
        name,
        avatar: avatar_url,
        platform: OauthPlatform.github,
    };
};
async function handler(req, res) {
    const { platform, code, back_to } = req.query;
    let userBrief;
    if (platform === OauthPlatform.github) {
        userBrief = await getGithubUser(code);
    }
    const cacheBrief = await db.user.detail.get(userBrief.platform, userBrief.identifier);
    // do not have any cache
    if (!cacheBrief) {
        await db.user.detail.set(userBrief.platform, userBrief.identifier, userBrief);
    }
    const token = Jwt.sign({
        user: {
            identifier: userBrief?.identifier,
            platform,
        },
    }, getEnv().JWT_KEY);
    const redirectUrl = clientHost +
        '/user/login' +
        `?back=${decodeURIComponent(back_to)}` +
        `&token=${token}`;
    return res.redirect(redirectUrl);
}

export { handler as default };
