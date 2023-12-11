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
     * detail of user
     */
    DbUserScope["detail"] = "detail";
})(DbUserScope || (DbUserScope = {}));
const getKey = (scope, platform, identifier) => {
    return kvKey(['user', scope, platform, identifier]);
};
const detail$1 = {
    get: async (platform, identifier) => {
        return await kv.get(getKey(DbUserScope.detail, platform, identifier));
    },
    set: async (platform, identifier, value) => {
        return await kv.set(getKey(DbUserScope.detail, platform, identifier), value);
    },
};
const user = {
    detail: detail$1,
};

const db = Object.freeze({
    user,
});

async function handler(req, res, context) {
    return res.json(await db.user.detail.get(context.user.platform, context.user.identifier));
}
var detail = handlerBuilder(handler, [cors, auth]);

export { detail as default };
