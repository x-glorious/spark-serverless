var OauthPlatform;
(function (OauthPlatform) {
    OauthPlatform["github"] = "github";
})(OauthPlatform || (OauthPlatform = {}));

function handler(req, res) {
    req.query;
    console.error(req.query, OauthPlatform.github);
    return res.json({
        message: `Hello !`,
    });
}

export { handler as default };
