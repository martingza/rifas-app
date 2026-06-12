const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ 
            exito: false, 
            mensaje: 'No hay token, acceso denegado' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ 
            exito: false, 
            mensaje: 'Token inválido' 
        });
    }
};

module.exports = auth;