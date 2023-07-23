/* eslint-disable no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import { FileMiddleware } from './files';
import { HttpError } from '../types/http.error';
import multer from 'multer';
import sharp from 'sharp';
import { FireBase } from '../services/firebase';

type MockMulter = jest.Mock & { diskStorage: jest.Mock };
type MockSharp = jest.Mock & { [key: string]: jest.Mock };

jest.mock('multer', () => {
  const multer: MockMulter = jest.fn().mockImplementation(() => ({
    single: jest
      .fn()
      .mockImplementation(
        () => (req: Request, res: Response, next: NextFunction) => {
          req.body = { ...req.body, file: 'testfile' };
          next();
        }
      ),
  })) as MockMulter;

  multer.diskStorage = jest
    .fn()
    .mockImplementation(
      (options: {
        destination: '';
        filename: (req: object, file: object, cb: () => void) => void;
      }) => {
        options.filename({}, { originalname: '' }, () => null);
      }
    );
  return multer;
});

jest.mock('sharp', () => {
  const sharp: MockSharp = jest.fn() as MockSharp;
  sharp.mockReturnValue(sharp);
  sharp.resize = jest.fn().mockReturnValue(sharp);
  sharp.webp = jest.fn().mockReturnValue(sharp);
  sharp.toFormat = jest.fn().mockReturnValue(sharp);
  sharp.toFile = jest.fn().mockReturnValue(sharp);
  return sharp;
});

describe('Given FilesMiddleware', () => {
  const next = jest.fn();
  const filesMiddleware = new FileMiddleware();

  describe('When method singleFileStore is used', () => {
    test('Then it should ...', () => {
      filesMiddleware.singleFileStore();
      expect(multer).toHaveBeenCalled();
      expect(multer.diskStorage).toHaveBeenCalled();
    });
  });

  describe('When method singleFileStore is used and returned middleware is invoked', () => {
    test('Then it should modify the request body', () => {
      const singleFileStore = filesMiddleware.singleFileStore();
      const req = { body: { key: 'value' } } as unknown as Request;
      const res = {} as unknown as Response;

      singleFileStore(req, res, next);

      expect(req.body).toEqual({ key: 'value', file: 'testfile' });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('When method optimization is used without data of a file', () => {
    const req = {
      path: '/register',
    } as Request;
    const res = {} as unknown as Response;
    test('Then it should call next with the error', async () => {
      filesMiddleware.optimization(req, res, next);
      expect(next).toHaveBeenLastCalledWith(expect.any(HttpError));
    });
  });

  describe('When method saveImage is used with valid data', () => {
    const req = {
      body: {},
      file: { filename: 'test' },
    } as Request;
    const res = {} as unknown as Response;

    test('Then it should call next without parameters', async () => {
      FireBase.prototype.uploadFile = jest.fn();
      await filesMiddleware.saveDataImage(req, res, next);
      expect(FireBase.prototype.uploadFile).toHaveBeenCalled();
      expect(next).toHaveBeenLastCalledWith();
    });
  });

  describe('When method saveImage is used with NOT valid data', () => {
    const req = {} as Request;
    const res = {} as unknown as Response;

    test('Then it should call next with the error', () => {
      filesMiddleware.saveDataImage(req, res, next);
      expect(next).toHaveBeenLastCalledWith(expect.any(HttpError));
    });
  });

  describe('When method saveImage is used with a gif file', () => {
    const req = {
      body: {},
      file: { filename: 'test.gif', mimetype: 'image/gif' },
    } as unknown as Request;
    const res = {} as unknown as Response;

    test('Then it should use the original filename', async () => {
      FireBase.prototype.uploadFile = jest.fn();
      await filesMiddleware.saveDataImage(req, res, next);
      expect(FireBase.prototype.uploadFile).toHaveBeenCalledWith(
        req.file?.filename
      );
      expect(next).toHaveBeenCalled();
    });
  });

  describe('When method optimization is called', () => {
    const req = {
      body: {},
      file: { filename: 'test' },
    } as Request;
    const res = {} as unknown as Response;

    test('Then it should use "register" as the reqPath', async () => {
      req.path = '/register';
      await filesMiddleware.optimization(req, res, next);

      expect(sharp).toHaveBeenCalled();
      expect(next).toHaveBeenLastCalledWith();
    });

    test('Then it should use "post" as the reqPath', async () => {
      req.path = '/';
      await filesMiddleware.optimization(req, res, next);

      expect(sharp).toHaveBeenCalled();
      expect(next).toHaveBeenLastCalledWith();
    });
  });
});
