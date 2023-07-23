/* eslint-disable no-negated-condition */
import path from 'path';
import multer from 'multer';
import crypto from 'crypto';
import createDebug from 'debug';
import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../types/http.error.js';
import sharp from 'sharp';
import { FireBase } from '../services/firebase.js';
const debug = createDebug('FinalMeme:FileMiddleware');

const optionsSets: {
  [key: string]: {
    width: number;
    height: number;
    fit: keyof sharp.FitEnum;
    position: string;
    quality: number;
  };
} = {
  register: {
    width: 300,
    height: 300,
    fit: 'cover',
    position: 'top',
    quality: 100,
  },
  post: {
    width: 600,
    height: 600,
    fit: 'inside',
    position: 'center',
    quality: 90,
  },
};

export class FileMiddleware {
  constructor() {
    debug('Instantiate');
  }

  singleFileStore(fileName = 'file', fileSize = 8_000_000) {
    const upload = multer({
      storage: multer.diskStorage({
        destination: 'public/uploads',
        filename(req, file, callback) {
          const suffix = crypto.randomUUID();
          const extension = path.extname(file.originalname);
          const basename = path.basename(file.originalname, extension);
          const filename = `${basename}-${suffix}${extension}`;
          callback(null, filename);
        },
      }),
      limits: {
        fileSize,
      },
    });
    const middleware = upload.single(fileName);
    return (req: Request, res: Response, next: NextFunction) => {
      const previous = req.body;
      middleware(req, res, next);
      req.body = { ...previous, ...req.body };
    };
  }

  async optimization(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new HttpError(406, 'Not Acceptable', 'Not valid image file');
      }

      const fileName = req.file.filename;
      const baseFileName = `${path.basename(fileName, path.extname(fileName))}`;

      if (req.file.mimetype !== 'image/gif') {
        const reqPath = req.path.split('/')[1] ? 'register' : 'post';
        const options = optionsSets[reqPath];

        const imageData = await sharp(path.join('public/uploads', fileName))
          .resize(options.width, options.height, {
            fit: options.fit,
            position: options.position,
          })
          .webp({ quality: options.quality })
          .toFormat('webp')
          .toFile(path.join('public/uploads', `${baseFileName}_1.webp`));

        req.file.originalname = req.file.path;
        req.file.filename = `${baseFileName}.${imageData.format}`;
        req.file.mimetype = `image/${imageData.format}`;
        req.file.path = path.join('public/uploads', req.file.filename);
        req.file.size = imageData.size;
      }

      next();
    } catch (error) {
      next(error);
    }
  }

  saveDataImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file)
        throw new HttpError(406, 'Not Acceptable', 'Not valid image file');

      const imageToOptimize = req.file.filename.split('.');
      let userImage;
      if (req.file.mimetype !== 'image/gif') {
        userImage = imageToOptimize[0] + '_1.' + imageToOptimize[1];
      } else {
        userImage = req.file.filename;
      }

      const firebase = new FireBase();
      const backupImage = await firebase.uploadFile(userImage);

      req.body[req.file.fieldname] = {
        urlOriginal: req.file.originalname,
        url: backupImage,
        mimetype: req.file.mimetype,
        size: req.file.size,
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}
