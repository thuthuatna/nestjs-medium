import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SwaggerTokenPrefixMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const auth = req.headers['authorization'];

    // If the Authorization header exists and does not start with 'token ',
    if (auth && typeof auth === 'string' && !auth.startsWith('token ')) {
      req.headers['authorization'] = `token ${auth}`;
    }

    next();
  }
}
