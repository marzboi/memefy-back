/* eslint-disable no-unused-vars */

import { PostRepo } from '../repository/post.mongo.repository.js';
import { Controller } from './basic.controller.js';
import { Post } from '../entities/post.js';
import createDebug from 'debug';
import { NextFunction, Request, Response } from 'express';
import { UserRepo } from '../repository/user.mongo.repository.js';
import { ApiResponse } from '../types/response.api.js';
import { PayloadToken } from '../services/auth.js';
const debug = createDebug('FinalMeme:PostController');

export class PostController extends Controller<Post> {
  constructor(
    public repo: PostRepo,
    private userRepo: UserRepo,
    private app: any
  ) {
    super();
    debug('Instantiated');
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page as string) || 1;
      const limit = 3;
      const flair = req.query.flair as string;

      let items: Post[] = [];
      let next = null;
      let previous = null;
      let baseUrl = '';

      if (flair) {
        items = await this.repo.query(page, limit, flair);

        const totalCount = await this.repo.count(flair);

        const totalPages = Math.ceil(totalCount / limit);

        baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;

        if (page < totalPages) {
          next = `${baseUrl}?flair=${flair}&page=${page + 1}`;
        }

        if (page > 1) {
          previous = `${baseUrl}?flair=${flair}&page=${page - 1}`;
        }

        const response: ApiResponse = {
          items,
          count: totalCount,
          previous,
          next,
        };
        res.send(response);
      } else {
        items = await this.repo.query(page, limit);
        const totalCount = await this.repo.count();

        const totalPages = Math.ceil(totalCount / limit);

        baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;

        if (page < totalPages) {
          next = `${baseUrl}?page=${page + 1}`;
        }

        if (page > 1) {
          previous = `${baseUrl}?page=${page - 1}`;
        }

        const response: ApiResponse = {
          items,
          count: totalCount,
          previous,
          next,
        };
        res.send(response);
      }
    } catch (error) {
      next(error);
    }
  }

  async post(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.body.userToken) {
        throw new Error('Token payload is missing');
      }

      const { id } = req.body.userToken as PayloadToken;
      const user = await this.userRepo.queryById(id);

      delete req.body.userToken;
      req.body.owner = id;
      const newPost = await this.repo.create(req.body);
      user.createdPost.push(newPost);
      await this.userRepo.update(id, user);

      res.status(201);
      res.send(newPost);
      this.app.locals.io.emit('postCreated');
    } catch (error) {
      next(error);
    }
  }

  async deleteById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.body.userToken) {
        throw new Error('Token payload is missing');
      }

      await this.repo.delete(req.params.id);

      const { id } = req.body.userToken as PayloadToken;
      const user = await this.userRepo.queryById(id);

      const createdPost = user.createdPost.findIndex(
        (item) => item.id === req.params.id
      );
      user.createdPost.splice(createdPost, 1);

      await this.userRepo.update(id, user);

      res.status(204);
      res.send();
      this.app.locals.io.emit('postDeleted');
    } catch (error) {
      next(error);
    }
  }

  async addToFavorite(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: userId } = req.body.userToken as PayloadToken;
      const user = await this.userRepo.queryById(userId);
      const postToAdd = await this.repo.queryById(req.params.id);

      if (!user.favoritePost.some((post) => post.id === postToAdd.id)) {
        user.favoritePost.push(postToAdd);
      }

      const updatedUser = await this.userRepo.update(userId, user);
      res.send(updatedUser);
    } catch (error) {
      next(error);
    }
  }

  async removeToFavorite(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: userId } = req.body.userToken as PayloadToken;
      const user = await this.userRepo.queryById(userId);

      const favoriteDeleted = user.favoritePost.findIndex(
        (item) => item.id === req.params.id
      );
      user.favoritePost.splice(favoriteDeleted, 1);

      const updatedUser = await this.userRepo.update(userId, user);

      res.send(updatedUser);
    } catch (error) {
      next(error);
    }
  }

  async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: userId } = req.body.userToken as PayloadToken;
      const post = await this.repo.queryById(req.params.id);
      const user = await this.userRepo.queryById(userId);

      post.comments.push({ comment: req.body.comment, owner: user });

      const updatedPost = await this.repo.update(req.params.id, post);

      res.send(updatedPost);
      this.app.locals.io.emit('updatePost');
    } catch (error) {
      next(error);
    }
  }

  async patch(req: Request, res: Response, next: NextFunction) {
    try {
      res.send(await this.repo.update(req.params.id, req.body));
      res.status(202);
      this.app.locals.io.emit('updatePost');
    } catch (error) {
      next(error);
    }
  }
}
