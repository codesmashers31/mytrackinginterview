import authMiddleware from './authMiddleware.js';
import requireRole from './roleMiddleware.js';

export { authMiddleware };
export const roleMiddleware = requireRole;
export default authMiddleware;
