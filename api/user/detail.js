import { omit } from 'lodash-es';
import Jwt from 'jsonwebtoken';
import { kv } from '@vercel/kv';

const handlerBuilder = (handler, plugins) => {
    return async (req, res) => {
        const tasks = [...plugins, { run: handler }];
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

var RuntimeEnv;
(function (RuntimeEnv) {
    RuntimeEnv["dev"] = "development";
    RuntimeEnv["pro"] = "production";
})(RuntimeEnv || (RuntimeEnv = {}));
const getEnv = () => process.env;

const auth = {
    run: async (req, res, context) => {
        const authorization = req.headers['x-authorization'];
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { user } = Jwt.verify(authorization, getEnv().JWT_KEY);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
const detail$1 = {
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
    detail: detail$1,
};

const db = Object.freeze({
    user,
});

async function handler(req, res, context) {
    const result = await db.user.detail.get(context.user.id);
    return result
        ? res.json(omit(result, ['platformIdentifier']))
        : res.status(401).end();
}
var detail = handlerBuilder(handler, [cors, auth]);

export { detail as default };
