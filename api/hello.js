function handler(req, res) {
    const { name = 'World' } = req.query;
    return res.json({
        message: `Hello ${name}!`,
    });
}

export { handler as default };
