import { OauthPlatform } from '../.global/types/.oauth';
export default function handler(req, res) {
    const { platform, code } = req.query;
    console.error(req.query, OauthPlatform.github);
    return res.json({
        message: `Hello !`,
    });
}
