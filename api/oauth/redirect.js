"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _oauth_1 = require("../.global/types/.oauth");
function handler(req, res) {
    const { platform, code } = req.query;
    console.error(req.query, _oauth_1.OauthPlatform.github);
    return res.json({
        message: `Hello !`,
    });
}
exports.default = handler;
