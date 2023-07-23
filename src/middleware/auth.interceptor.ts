import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../types/http.error.js';
import { AuthServices, PayloadToken } from '../services/auth.js';
import createDebug from 'debug';
import { PostRepo } from '../repository/post.mongo.repository.js';
import { UserRepo } from '../repository/user.mongo.repository.js';
const debug = createDebug('FinalMeme:AuthInterceptor');
export class AuthInterceptor {
  // eslint-disable-next-line no-unused-vars
  constructor(private repo: PostRepo, private userRepo: UserRepo) {
    debug('instanciated');
  }

  logged(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new HttpError(401, 'Not authorized', 'Not authorization header');
      }

      if (!authHeader.startsWith('Bearer')) {
        throw new HttpError(
          401,
          'Not authorized',
          'No Bearer in authorization header'
        );
      }

      const token = authHeader.slice(7);
      const payload = AuthServices.verifyToken(token);

      req.body.userToken = payload;

      next();
    } catch (error) {
      next(error);
    }
  }

  async authorized(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.body.userToken) {
        throw new HttpError(
          498,
          'Token not found',
          'Token not found in authorized interceptor'
        );
      }

      const { id: userId } = req.body.userToken as PayloadToken;
      const { id: postId } = req.params;

      const post = await this.repo.queryById(postId);

      if (post.owner.id !== userId) {
        throw new HttpError(401, 'Not Authorized', 'Not Authorized');
      }

      next();
    } catch (error) {
      next(error);
    }
  }
}
