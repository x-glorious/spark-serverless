import Jwt from 'jsonwebtoken';

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
            const { user } = Jwt.verify(authorization, getEnv().JWT_KEY);
            context.user = user;
            return undefined;
        }
        catch (_e) {
        }
        return res.status(401).end();
    }
};

const cors = {
    run: async (req, res, context) => {
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }
        return undefined;
    }
};

async function handler(req, res, context) {
    return res.json(context);
}
var brief = handlerBuilder(handler, [cors, auth]);

export { brief as default };
