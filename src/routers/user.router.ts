import { Router as createRouter } from 'express';
import { User } from '../entities/user.js';
import { UserRepo } from '../repository/user.mongo.repository.js';
import { Repo } from '../repository/repo.js';
import { UserController } from '../controllers/user.controller.js';
import createDebug from 'debug';
import { FileMiddleware } from '../middleware/files.js';
import { ValidationMiddleware } from '../services/validation.js';
import { AuthInterceptor } from '../middleware/auth.interceptor.js';
import { PostRepo } from '../repository/post.mongo.repository.js';
import { Post } from '../entities/post.js';
const debug = createDebug('FinalMeme:UserRouter');

const userRepo: Repo<User> = new UserRepo() as Repo<User>;
const postRepo: Repo<Post> = new PostRepo() as Repo<Post>;
const controller = new UserController(userRepo);
const fileStore = new FileMiddleware();
const validation = new ValidationMiddleware();
const auth = new AuthInterceptor(postRepo, userRepo);
export const userRouter = createRouter();
debug('Instantiated');

userRouter.get('/', controller.getAll.bind(controller));

userRouter.get(
  '/:id',
  auth.logged.bind(auth),
  controller.getById.bind(controller)
);

userRouter.post(
  '/register',
  fileStore.singleFileStore('avatar').bind(fileStore),
  validation.registerValidation().bind(validation),
  fileStore.optimization.bind(fileStore),
  fileStore.saveDataImage.bind(fileStore),
  controller.register.bind(controller)
);

userRouter.patch('/login', controller.login.bind(controller));
