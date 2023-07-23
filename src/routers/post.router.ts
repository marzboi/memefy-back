import { Router as createRouter } from 'express';
import { PostController } from '../controllers/post.controller.js';
import { Post } from '../entities/post.js';
import { Repo } from '../repository/repo.js';
import { PostRepo } from '../repository/post.mongo.repository.js';
import { AuthInterceptor } from '../middleware/auth.interceptor.js';
import { UserRepo } from '../repository/user.mongo.repository.js';
import { FileMiddleware } from '../middleware/files.js';

export const createPostRouter = (app: any) => {
  const repo: Repo<Post> = new PostRepo();
  const repoUser = new UserRepo();
  const controller = new PostController(repo, repoUser, app);
  const fileStore = new FileMiddleware();
  const auth = new AuthInterceptor(repo, repoUser);
  const postRouter = createRouter(app);

  postRouter.get('/', controller.getAll.bind(controller));

  postRouter.get('/:id', controller.getById.bind(controller));

  postRouter.post(
    '/',
    auth.logged.bind(auth),
    fileStore.singleFileStore('image').bind(fileStore),
    fileStore.optimization.bind(fileStore),
    fileStore.saveDataImage.bind(fileStore),
    controller.post.bind(controller)
  );

  postRouter.patch(
    '/:id',
    auth.logged.bind(auth),
    auth.authorized.bind(auth),
    controller.patch.bind(controller)
  );

  postRouter.delete(
    '/:id',
    auth.logged.bind(auth),
    auth.authorized.bind(auth),
    controller.deleteById.bind(controller)
  );

  postRouter.patch(
    '/addfavorite/:id',
    auth.logged.bind(auth),
    controller.addToFavorite.bind(controller)
  );

  postRouter.patch(
    '/removefavorite/:id',
    auth.logged.bind(auth),
    controller.removeToFavorite.bind(controller)
  );

  postRouter.patch(
    '/addcomment/:id',
    auth.logged.bind(auth),
    controller.addComment.bind(controller)
  );

  return postRouter;
};
