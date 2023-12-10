import Jwt from 'jsonwebtoken';

const handlerBuilder = (handler, plugins) => {
    return async (req, res) => {
        console.error('enter 1');
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
        return res.status(401).json({});
    }
};

const cors = {
    run: async (req, res, context) => {
        console.error('1111');
        // console.error('enter')
        // const headers = [
        //   { "key": "Access-Control-Allow-Credentials", "value": "true" },
        //   { "key": "Access-Control-Allow-Origin", "value": "*" },
        //   { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        //   { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" }
        // ]
        // headers.forEach(({key, value}) => res.setHeader(key, value))
        if (req.method === 'OPTIONS') {
            console.error('2');
            return res.status(200).send('ok');
            // res.setStatus(200)
        }
        return undefined;
    }
};

async function handler(req, res, context) {
    return res.json(context);
}
var brief = handlerBuilder(handler, [cors, auth]);

export { brief as default };
