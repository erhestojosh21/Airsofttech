
const sql = require('mssql');
const jwt = require('jsonwebtoken');

module.exports = (pool, secretKey) => {
    return async (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication token required.' });
        }

        try {
            const decoded = jwt.verify(token, secretKey);

            // Fetch the employee from the database to check current status and tokenVersion
            const request = pool.request();
            const result = await request
                .input('employeeId', decoded.employeeId)
                .query('SELECT employeeId, username, roleId, terminated, tokenVersion FROM Employees WHERE employeeId = @employeeId');

            const employee = result.recordset[0];

            if (!employee) {
                // User not found in DB (might have been deleted)
                return res.status(401).json({ message: 'Invalid token: User not found.' });
            }

            // If the employee is marked as terminated (terminated = 1) in the database
            // OR if the token's version does not match the database's version
            if (employee.terminated === 1 || employee.tokenVersion !== decoded.tokenVersion) {
                // This message is what your frontend will look for to trigger the modal
                return res.status(401).json({ message: 'Account terminated or session invalid.' });
            }

            // If everything is good, attach employee info to the request
            req.employee = {
                employeeId: employee.employeeId,
                username: employee.username,
                roleId: employee.roleId,
                // Pass permissions from the decoded token (they are usually fresh enough)
                permissions: decoded.permissions || []
            };
            next(); // Proceed to the next middleware/route handler

        } catch (err) {
            console.error("JWT verification error:", err);
            // Generic message for other token errors (e.g., expired, malformed)
            return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
        }
    };
};