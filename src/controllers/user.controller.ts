import { NextFunction, Request, Response } from 'express';
import { UserRepo } from '../repository/user.mongo.repository.js';
import { AuthServices, PayloadToken } from '../services/auth.js';
import { HttpError } from '../types/http.error.js';
import { LoginResponse } from '../types/response.api.js';
import { Controller } from './basic.controller.js';
import { User } from '../entities/user.js';
import createDebug from 'debug';
const debug = createDebug('FinalMeme:UserController');

export class UserController extends Controller<User> {
  // eslint-disable-next-line no-unused-vars
  constructor(public repo: UserRepo) {
    super();
    debug('Instantiated');
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const passwd = await AuthServices.hash(req.body.passwd);
      req.body.passwd = passwd;

      res.status(201);
      res.send(await this.repo.create(req.body));
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.body.user || !req.body.passwd) {
        throw new HttpError(400, 'Bad request', 'User or password invalid');
      }

      let data = await this.repo.search({
        key: 'userName',
        value: req.body.user,
      });
      if (!data.length) {
        data = await this.repo.search({
          key: 'email',
          value: req.body.user,
        });
      }

      if (!data.length) {
        throw new HttpError(400, 'Bad request', 'User or password invalid');
      }

      const isUserValid = AuthServices.compare(req.body.passwd, data[0].passwd);
      if (!isUserValid) {
        throw new HttpError(400, 'Bad request', 'User or password invalid');
      }

      const payload: PayloadToken = {
        id: data[0].id,
        userName: data[0].userName,
        avatar: data[0].avatar,
      };
      const token = AuthServices.createToken(payload);
      const response: LoginResponse = {
        token,
        user: data[0],
      };

      res.send(response);
    } catch (error) {
      next(error);
    }
  }
}
