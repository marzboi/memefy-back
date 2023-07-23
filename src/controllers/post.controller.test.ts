import { Request, Response, NextFunction } from 'express';
import { PostController } from './post.controller';
import { PostRepo } from '../repository/post.mongo.repository';
import { UserRepo } from '../repository/user.mongo.repository';
import { Post } from '../entities/post';
import { User } from '../entities/user';

let mockPostRepo: PostRepo;
let mockUserRepo: UserRepo;
let req: Request;
let res: Response;
let next: NextFunction;

describe('Given a PostController', () => {
  const app: any = {};
  beforeEach(() => {
    mockPostRepo = {
      query: jest.fn(),
      queryById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    } as unknown as PostRepo;

    mockUserRepo = {
      queryById: jest.fn(),
      update: jest.fn(),
    } as unknown as UserRepo;

    req = {
      query: {},
      body: {},
      params: {},
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:4400'),
      baseUrl: '/posts',
    } as unknown as Request;

    res = {
      send: jest.fn(),
      status: jest.fn(),
    } as unknown as Response;

    next = jest.fn() as NextFunction;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('When it is instantiated and getAll method is called', () => {
    test('Then method query should have been called', async () => {
      const controller = new PostController(mockPostRepo, mockUserRepo, app);
      req.query = { page: '6' };
      await controller.getAll(req, res, next);
      expect(mockPostRepo.query).toHaveBeenCalledWith(6, 3);
      expect(mockPostRepo.count).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalled();
    });

    test('Then method query should have been called with flair', async () => {
      const controller = new PostController(mockPostRepo, mockUserRepo, app);
      req.query = { page: '2', flair: 'test' };
      await controller.getAll(req, res, next);
      expect(mockPostRepo.query).toHaveBeenCalledWith(2, 3, 'test');
      expect(mockPostRepo.count).toHaveBeenCalledWith('test');
      expect(res.send).toHaveBeenCalled();
    });

    test('Then it should handle the error case', async () => {
      mockPostRepo.query = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      const controller = new PostController(mockPostRepo, mockUserRepo, app);
      await controller.getAll(req, res, next);

      expect(mockPostRepo.query).toHaveBeenCalled();
      expect(mockPostRepo.count).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(new Error('Database error'));
    });

    test('Then it should calculate the next page URL if there are more pages', async () => {
      const controller = new PostController(mockPostRepo, mockUserRepo, app);
      req.query = { page: '1' };

      mockPostRepo.count = jest.fn().mockResolvedValue(4);
      mockPostRepo.query = jest.fn().mockResolvedValue([{}, {}, {}]);

      await controller.getAll(req, res, next);

      expect(mockPostRepo.query).toHaveBeenCalledWith(1, 3);
      expect(mockPostRepo.count).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalled();
    });

    test('Then it should calculate the next page URL if there are more pages', async () => {
      const controller = new PostController(mockPostRepo, mockUserRepo, app);
      const flair = 'testFlair';
      req.query = { page: '1', flair };

      mockPostRepo.count = jest.fn().mockResolvedValue(4);
      mockPostRepo.query = jest.fn().mockResolvedValue([{}, {}, {}]);

      await controller.getAll(req, res, next);

      expect(mockPostRepo.query).toHaveBeenCalledWith(1, 3, flair);
      expect(mockPostRepo.count).toHaveBeenCalledWith(flair);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('When it is instantiated and post method is called', () => {
    test('Then method post should have been called', async () => {
      const mockCreatedPost: Post = {
        id: '1',
        description: 'New post',
        owner: '1',
      } as unknown as Post;

      const mockUser: User = {
        id: '1',
        username: 'testuser',
        createdPost: [],
        favoritePost: [],
      } as unknown as User;

      mockPostRepo.create = jest.fn().mockResolvedValue(mockCreatedPost);
      mockUserRepo.queryById = jest.fn().mockResolvedValue(mockUser);
      mockUserRepo.update = jest.fn().mockResolvedValue(mockUser);

      req.body = {
        userToken: { id: '1' },
        description: 'New post',
        owner: '',
      };

      const controller = new PostController(mockPostRepo, mockUserRepo, app);
      await controller.post(req, res, next);

      expect(mockPostRepo.create).toHaveBeenCalledWith(req.body);
      expect(mockUserRepo.queryById).toHaveBeenCalledWith('1');
      expect(mockUserRepo.update).toHaveBeenCalledWith('1', {
        ...mockUser,
        createdPost: [mockCreatedPost],
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(mockCreatedPost);
    });

    test('Then it should throw an error when token payload is missing', async () => {
      req.body = {
        userToken: undefined,
        description: 'No token',
        owner: '',
      };

      const controller = new PostController(mockPostRepo, mockUserRepo, app);
      await controller.post(req, res, next);

      expect(mockPostRepo.create).not.toHaveBeenCalled();
      expect(mockUserRepo.queryById).not.toHaveBeenCalled();
      expect(mockUserRepo.update).not.toHaveBeenCalled();

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('When it is instantiated and deleteById method is called', () => {
    test('Then method delete should have been called', async () => {
      const mockUser: User = {
        id: '1',
        username: 'testuser',
        createdPost: [{ id: 'post1' }],
        favoritePost: [],
      } as unknown as User;

      mockPostRepo.delete = jest.fn();
      mockUserRepo.queryById = jest.fn().mockResolvedValue(mockUser);
      mockUserRepo.update = jest.fn().mockResolvedValue(mockUser);

      req.body = {
        userToken: { id: '1' },
      };
      req.params = {
        id: 'post1',
      };

      const controller = new PostController(mockPostRepo, mockUserRepo, app);
      await controller.deleteById(req, res, next);

      expect(mockPostRepo.delete).toHaveBeenCalledWith('post1');
      expect(mockUserRepo.queryById).toHaveBeenCalledWith('1');
      expect(mockUserRepo.update).toHaveBeenCalledWith('1', {
        ...mockUser,
        createdPost: [],
      });

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    test('Then it should throw an error when token payload is missing', async () => {
      req.body = {
        userToken: undefined,
      };

      const controller = new PostController(mockPostRepo, mockUserRepo, app);
      await controller.deleteById(req, res, next);

      expect(mockPostRepo.delete).not.toHaveBeenCalled();
      expect(mockUserRepo.queryById).not.toHaveBeenCalled();
      expect(mockUserRepo.update).not.toHaveBeenCalled();

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('When it is instantiated and addToFavorite method is called', () => {
    test('Then method addToFavorites should have been called', async () => {
      const mockUser: User = {
        id: '1',
        username: 'testuser',
        createdPost: [],
        favoritePost: [],
      } as unknown as User;

      const mockPost: Post = {
        id: 'post1',
        description: 'Test post',
        owner: '2',
      } as unknown as Post;

      mockUserRepo.queryById = jest.fn().mockResolvedValue(mockUser);
      mockPostRepo.queryById = jest.fn().mockResolvedValue(mockPost);
      mockUserRepo.update = jest.fn().mockResolvedValue(mockUser);

      req.body = {
        userToken: { id: '1' },
      };
      req.params = {
        id: 'post1',
      };

      const controller = new PostController(mockPostRepo, mockUserRepo, app);
      await controller.addToFavorite(req, res, next);

      expect(mockUserRepo.queryById).toHaveBeenCalledWith('1');
      expect(mockPostRepo.queryById).toHaveBeenCalledWith('post1');
      expect(mockUserRepo.update).toHaveBeenCalledWith('1', {
        ...mockUser,
        favoritePost: [mockPost],
      });

      expect(res.send).toHaveBeenCalledWith(mockUser);
    });

    test('Then it should not add a post to favorites if it already exists', async () => {
      const mockUser: User = {
        id: '1',
        username: 'testuser',
        createdPost: [],
        favoritePost: [{ id: 'post1' }],
      } as unknown as User;

      const mockPost: Post = {
        id: 'post1',
        description: 'Test post',
        owner: '2',
      } as unknown as Post;

      mockUserRepo.queryById = jest.fn().mockResolvedValue(mockUser);
      mockPostRepo.queryById = jest.fn().mockResolvedValue(mockPost);
      mockUserRepo.update = jest.fn().mockResolvedValue(mockUser);

      req.body = {
        userToken: { id: '1' },
      };
      req.params = {
        id: 'post1',
      };

      const controller = new PostController(mockPostRepo, mockUserRepo, app);
      await controller.addToFavorite(req, res, next);

      expect(mockUserRepo.queryById).toHaveBeenCalledWith('1');
      expect(mockPostRepo.queryById).toHaveBeenCalledWith('post1');
      expect(mockUserRepo.update).toHaveBeenCalledWith('1', mockUser);

      expect(res.send).toHaveBeenCalledWith(mockUser);
    });

    test('Then it should throw an error when token payload is missing', async () => {
      req.body = {
        userToken: undefined,
      };

      const controller = new PostController(mockPostRepo, mockUserRepo, app);
      await controller.addToFavorite(req, res, next);

      expect(mockPostRepo.delete).not.toHaveBeenCalled();
      expect(mockUserRepo.queryById).not.toHaveBeenCalled();
      expect(mockUserRepo.update).not.toHaveBeenCalled();

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('When it is instantiated and removeToFavorite method is called', () => {
    test('Then method queryById should have been called', async () => {
      const mockUser: User = {
        id: '1',
        username: 'testuser',
        createdPost: [],
        favoritePost: [{ id: 'post1' }],
      } as unknown as User;

      mockUserRepo.queryById = jest.fn().mockResolvedValue(mockUser);
      mockUserRepo.update = jest.fn().mockResolvedValue(mockUser);

      req.body = {
        userToken: { id: '1' },
      };
      req.params = {
        id: 'post1',
      };

      const controller = new PostController(mockPostRepo, mockUserRepo, app);
      await controller.removeToFavorite(req, res, next);

      expect(mockUserRepo.queryById).toHaveBeenCalledWith('1');
      expect(mockUserRepo.update).toHaveBeenCalledWith('1', {
        ...mockUser,
        favoritePost: [],
      });

      expect(res.send).toHaveBeenCalledWith(mockUser);
    });

    test('Then it should not remove the post from favorites if it does not exist', async () => {
      const mockUser: User = {
        id: '1',
        username: 'testuser',
        createdPost: [],
        favoritePost: [],
      } as unknown as User;

      mockUserRepo.queryById = jest.fn().mockResolvedValue(mockUser);
      mockUserRepo.update = jest.fn().mockResolvedValue(mockUser);

      req.body = {
        userToken: { id: '1' },
      };
      req.params = {
        id: 'post1',
      };

      const controller = new PostController(mockPostRepo, mockUserRepo, app);
      await controller.removeToFavorite(req, res, next);

      expect(mockUserRepo.queryById).toHaveBeenCalledWith('1');
      expect(mockUserRepo.update).toHaveBeenCalledWith('1', mockUser);

      expect(res.send).toHaveBeenCalledWith(mockUser);
    });

    test('Then it should throw an error when token payload is missing', async () => {
      req.body = {
        userToken: undefined,
      };

      const controller = new PostController(mockPostRepo, mockUserRepo, app);
      await controller.removeToFavorite(req, res, next);

      expect(mockPostRepo.delete).not.toHaveBeenCalled();
      expect(mockUserRepo.queryById).not.toHaveBeenCalled();
      expect(mockUserRepo.update).not.toHaveBeenCalled();

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('When it is instantiated and addComment methid is called', () => {
    test('should add a comment to a post and return the updated post', async () => {
      const mockUser: User = {
        id: '1',
        username: 'testuser',
        createdPost: [],
        favoritePost: [{ id: 'post1' }],
      } as unknown as User;

      const mockPost: Post = {
        id: '1',
        description: 'Test post',
        owner: '2',
        comments: [],
      } as unknown as Post;

      mockUserRepo.queryById = jest.fn().mockResolvedValue(mockUser);
      mockPostRepo.queryById = jest.fn().mockResolvedValue(mockPost);
      mockPostRepo.update = jest.fn().mockResolvedValue(mockPost);

      req.body = {
        userToken: { id: '1' },
        comment: 'test comment',
      };
      req.params = {
        id: '1',
      };

      const controller = new PostController(mockPostRepo, mockUserRepo, app);
      await controller.addComment(req, res, next);

      expect(mockUserRepo.queryById).toHaveBeenCalledWith('1');
      expect(mockPostRepo.queryById).toHaveBeenCalledWith('1');
      expect(mockPostRepo.update).toHaveBeenCalledWith('1', mockPost);

      expect(res.send).toHaveBeenCalledWith(mockPost);
    });

    test('Then it should throw an error when the user token is missing', async () => {
      req.body = {
        userToken: undefined,
      };

      const controller = new PostController(mockPostRepo, mockUserRepo, app);
      await controller.addComment(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('When it is instantiated and patch method is called', () => {
    test('Then it should throw an error when the user token is missing', async () => {
      req.body = {
        userToken: undefined,
      };

      const controller = new PostController(mockPostRepo, mockUserRepo, app);
      await controller.patch(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
