import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import createDebug from 'debug';
import { errorHandler } from './middleware/error.js';
import { userRouter } from './routers/user.router.js';
import { createPostRouter } from './routers/post.router.js';
const debug = createDebug('FinalMeme:App');

export const app = express();

debug('Loaded Express App');

const corsOptions = {
  origin: '*',
};

app.use(morgan('dev'));
app.use(cors(corsOptions));
app.use(express.json());

app.set('trust proxy', true);

app.use((req, res, next) => {
  res.header('Content-Security-Policy', 'upgrade-insecure-requests;');
  next();
});

app.use(express.static('public'));

app.use('/user', userRouter);
app.use('/post', createPostRouter(app));
app.use(errorHandler);
