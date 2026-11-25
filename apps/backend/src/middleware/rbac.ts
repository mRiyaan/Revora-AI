import { NextFunction, Request, Response } from 'express';
import { DEMO_ROLES, DemoRole } from '@revora/shared';

declare global {
  namespace Express {
    interface Request {
      demoRole: DemoRole;
      actorName: string;
    }
  }
}

export function extractDemoRole(req: Request, _res: Response, next: NextFunction): void {
  const headerVal = req.header('X-Demo-Role');
  const queryVal = typeof req.query.role === 'string' ? req.query.role : undefined;
  const candidate = (headerVal || queryVal || 'Support').trim();
  const validRole = DEMO_ROLES.find(
    (r) => r.toLowerCase() === candidate.toLowerCase()
  );
  req.demoRole = validRole || 'Support';
  req.actorName = `Demo ${req.demoRole}`;
  next();
}
