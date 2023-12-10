import Jwt from 'jsonwebtoken';
import Cookie from 'cookie';

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

const clientHost = getEnv().VERCEL_ENV === RuntimeEnv.dev ? 'http://localhost:22333' : 'https://spark-sea.vercel.app';

const getGithubUser = async (code) => {
    // const tokenResponse = await axios({
    //   method: 'post',
    //   url: 'https://github.com/login/oauth/access_token?' +
    //     `client_id=${getEnv().OAUTH_GITHUB_CLIENT_ID}&` +
    //     `client_secret=${getEnv().OAUTH_GITHUB_CLIENT_SECRET}&` +
    //     `code=${code}`,
    //   headers: {
    //     accept: 'application/json'
    //   }
    // })
    // const accessToken = tokenResponse.data.access_token
    // const result = await axios({
    //   method: 'get',
    //   url: `https://api.github.com/user`,
    //   headers: {
    //     accept: 'application/json',
    //     Authorization: `token ${accessToken}`
    //   }
    // })
    // return result.data.id
    return 'test-id';
};
async function handler(req, res) {
    const { platform, code, back_to } = req.query;
    let identifier;
    if (platform === OauthPlatform.github) {
        identifier = await getGithubUser();
    }
    const token = Jwt.sign({
        user: {
            identifier,
            platform
        }
    }, getEnv().JWT_KEY);
    return res.setHeader('Set-Cookie', Cookie.serialize('authorization', token, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
    })).redirect(clientHost + decodeURIComponent(back_to));
}

export { handler as default };
