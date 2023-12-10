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
        const { authorization } = req.cookies;
        try {
            const { user } = Jwt.verify(authorization, getEnv().JWT_KEY);
            context.user = user;
            return undefined;
        }
        catch (_e) {
        }
        console.error('222');
        return res.status(401).send('unauthorized');
    }
};

const cors = {
    run: async (req, res, context) => {
        console.log(req.method);
        if (req.method === 'OPTIONS') {
            return res.status(200).send('ok');
        }
        return undefined;
    }
};

async function handler(req, res, context) {
    return res.json(context);
}
var brief = handlerBuilder(handler, [cors, auth]);

export { brief as default };
