import { Request, Response, NextFunction } from 'express';

export const provisioningMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers['x-provisioning-api-key'];
  const allowedIps = (process.env.ALLOWED_PROVISIONING_IPS || '').split(',').map(ip => ip.trim());
  const requestIp = req.ip || ''; // Ensure req.ip is always a string

  // Clean the key from the .env file to remove any strange characters or whitespace
  const expectedApiKey = (process.env.PROVISIONING_API_KEY || '').replace(/[^A-Za-z0-9_=-]/g, '');

  if (process.env.NODE_ENV !== 'development' && !allowedIps.includes(requestIp)) {
    return res.status(403).json({ error: 'Forbidden: IP address not allowed' });
  }

  // Compare the received key with the cleaned key
  if (!apiKey || apiKey !== expectedApiKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
  }

  return next(); // Explicitly return next()
};
