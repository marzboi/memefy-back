import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../types/http.error';
import mongoose, { mongo } from 'mongoose';
import { errorHandler } from './error';

describe('Given the handleError middleware', () => {
  describe('When it is instantiate', () => {
    const req = {} as Request;
    const res = {
      status: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    const mockConsoleError = jest.fn();

    beforeAll(() => {
      global.console.error = mockConsoleError;
    });

    test('When it is instantiate with a HttpError, then it should set a status, a statusMessage and an error object', () => {
      const error = new HttpError(
        404,
        'Not found',
        'The request was not found'
      );

      errorHandler(error, req, res, next);
      expect(res.status).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      expect(mockConsoleError).toHaveBeenCalledWith(
        error.status,
        error.statusMessage,
        error.message
      );
    });

    test('When it is not instantiate with a HttpError, it should set status to 500 and call the send method with an error object', () => {
      const error = new Error('Error');

      errorHandler(error, req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: 'Error' });
      expect(next).not.toHaveBeenCalled();
      expect(mockConsoleError).toHaveBeenCalledWith(error);
    });

    test('When it is instantiate with a mongoose.Error.ValidationError, then it should set a status, a statusMessage and an error object', () => {
      const error = new mongoose.Error.ValidationError();

      errorHandler(error, req, res, next);
      expect(res.status).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      expect(mockConsoleError).toHaveBeenCalledWith(
        '400 Bad Request',
        error.message
      );
    });

    test('When it is instantiate with a mongo.MongoServerError, then it should set a status, a statusMessage and an error object', () => {
      const error = new mongo.MongoServerError({
        ErrorDescription: 'MongoDB server error',
      });

      errorHandler(error, req, res, next);
      expect(res.status).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      expect(mockConsoleError).toHaveBeenCalledWith(
        '406 Not accepted',
        error.message
      );
    });
  });
});
