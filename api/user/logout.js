import Jwt from 'jsonwebtoken';
import 'nanoid';
import { kv } from '@vercel/kv';

const handlerBuilder = (handler, plugins) => {
    return async (req, res) => {
        const tasks = [...plugins, { run: handler }];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const context = {};
        let stopIndex = -1;
        let result = res;
        // forward
        for (const task of tasks) {
            const taskResult = await task.run?.(req, res, context);
            if (taskResult) {
                stopIndex++;
                result = taskResult;
                break;
            }
        }
        // backward
        for (const task of tasks.slice(0, stopIndex).reverse()) {
            const taskResult = await task.after?.(req, result, context);
            if (taskResult) {
                result = taskResult;
            }
        }
        return result;
    };
};

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

var RuntimeEnv;
(function (RuntimeEnv) {
    RuntimeEnv["dev"] = "development";
    RuntimeEnv["pro"] = "production";
})(RuntimeEnv || (RuntimeEnv = {}));
const getEnv = () => process.env;

const getJwtPayload = async (jwt) => {
    const { user, securityToken } = Jwt.verify(jwt, getEnv().JWT_KEY);
    const cacheSecurityToken = await db.oauth.securityToken.get(user.id);
    // check security token to disable abandoned jwt token
    if (cacheSecurityToken !== securityToken) {
        throw new Error();
    }
    return user;
};

const auth = {
    run: async (req, res, context) => {
        const authorization = req.headers['x-authorization'];
        try {
            const user = await getJwtPayload(authorization);
            context.user = user;
            return undefined;
        }
        catch (_e) {
            // default
        }
        return res.status(401).end();
    },
};

const cors = {
    run: async (req, res) => {
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }
        return undefined;
    },
};

async function handler(req, res, context) {
    // clear securityToken to disable old jwt token
    const result = await db.oauth.securityToken.set(context.user.id, '');
    return res.status(result ? 200 : 500).end();
}
var logout = handlerBuilder(handler, [cors, auth]);

export { logout as default };
