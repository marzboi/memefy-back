import { NextFunction, Request, Response } from 'express';
import { PostRepo } from '../repository/post.mongo.repository';
import { AuthInterceptor } from './auth.interceptor';
import { Post } from '../entities/post';
import { AuthServices, PayloadToken } from '../services/auth';
import { UserRepo } from '../repository/user.mongo.repository';
import { User } from '../entities/user';
import { HttpError } from '../types/http.error';

jest.mock('../services/auth');

describe('Given an interceptor', () => {
  let next: NextFunction;
  let req: Request;
  let mockPost: Partial<Post>;
  let res: Response;
  let mockRepo: PostRepo;
  let userRepo: UserRepo;
  let interceptor: AuthInterceptor;

  beforeEach(() => {
    next = jest.fn() as NextFunction;
    req = {
      params: { id: '1' },
    } as unknown as Request;

    mockPost = {
      owner: {
        id: '1',
        userName: 'test',
        passwd: 'test',
      } as unknown as User,
    };

    res = {} as Response;

    mockRepo = {
      queryById: jest.fn().mockResolvedValueOnce({ owner: { id: '1' } }),
    } as unknown as PostRepo;

    interceptor = new AuthInterceptor(mockRepo, userRepo);
  });
  describe('When it is instantiated and logged method is called', () => {
    test('Then next should have been called', () => {
      const mockPayload = {} as PayloadToken;
      const req = { body: { userToken: mockPayload } } as Request;
      const res = {} as Response;
      req.get = jest.fn().mockReturnValueOnce('Bearer valid token');
      const mockRepo: PostRepo = {} as unknown as PostRepo;
      const interceptor = new AuthInterceptor(mockRepo, userRepo);
      (AuthServices.verifyToken as jest.Mock).mockResolvedValueOnce(
        mockPayload
      );
      interceptor.logged(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('When it is instantiated and authorized method is called', () => {
    test('Then postRepo.queryById should have been called', () => {
      mockRepo.queryById(mockPost.owner!.id);
      interceptor.authorized(
        req as Request,
        res as Response,
        next as NextFunction
      );
      expect(mockRepo.queryById).toHaveBeenCalledWith(mockPost.owner!.id);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('When it is instantiated and authorized method is called', () => {
    test('Then next should have been called', async () => {
      await interceptor.authorized(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('When logged method is called but there is no authHeader', () => {
    test('Then it should throw an error', () => {
      const error = new HttpError(
        401,
        'Not Authorized',
        'Not authorization header'
      );
      const mockPayload = {} as PayloadToken;
      const req = { body: { userToken: mockPayload } } as Request;
      const res = {} as Response;
      req.get = jest.fn().mockReturnValueOnce(undefined);
      const mockRepo: PostRepo = {} as unknown as PostRepo;
      const interceptor = new AuthInterceptor(mockRepo, userRepo);
      (AuthServices.verifyToken as jest.Mock).mockResolvedValueOnce(
        mockPayload
      );
      interceptor.logged(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('When logged method is called but the header doesnt have bearer', () => {
    test('Then it should throw an error', () => {
      const error = new HttpError(
        401,
        'No Bearer in authorization header',
        'No Bearer in authorization header'
      );
      const mockPayload = {} as PayloadToken;
      const req = { body: { userToken: mockPayload } } as Request;
      const res = {} as Response;
      req.get = jest.fn().mockReturnValueOnce('Not valid token');
      const mockRepo: PostRepo = {} as unknown as PostRepo;
      const interceptor = new AuthInterceptor(mockRepo, userRepo);
      (AuthServices.verifyToken as jest.Mock).mockResolvedValueOnce(
        mockPayload
      );
      interceptor.logged(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  describe('When authorized method is called but no token is on the body', () => {
    test('Then it should throw an error', () => {
      const error = new HttpError(
        498,
        'Token not found',
        'Token not found in authorized interceptor'
      );
      const req = {
        body: { userToken: undefined },
        params: { id: '1' },
      } as unknown as Request;
      const res = {} as Response;
      const mockRepo: PostRepo = {} as unknown as PostRepo;
      const interceptor = new AuthInterceptor(mockRepo, userRepo);
      interceptor.authorized(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  describe('When authorized method is called but ids dont match', () => {
    test('Then it should throw an error', async () => {
      const error = new HttpError(401, 'Not authorized', 'Not Authorized');

      const mockPayload = { id: '5' } as PayloadToken;
      const req = {
        body: { userToken: mockPayload },
        params: { id: '1' },
      } as unknown as Request;

      await interceptor.authorized(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('When authorized method is called and userToken id matches the post owner id', () => {
    test('Then next should have been called', async () => {
      const mockPayload = { id: '1' } as PayloadToken;
      const req = {
        body: { userToken: mockPayload },
        params: { id: '1' },
      } as unknown as Request;

      mockRepo.queryById = jest.fn().mockResolvedValueOnce({
        owner: { id: mockPayload.id },
      });

      await interceptor.authorized(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
