import { Post } from '../entities/post';
import { HttpError } from '../types/http.error';
import { PostModel } from './post.mongo.model';
import { PostRepo } from './post.mongo.repository';

jest.mock('./user.mongo.model');

describe('Given the PostRepo class', () => {
  const repo = new PostRepo();
  describe('When it has been instantiated', () => {
    test('Then the query method should be used', async () => {
      const exec = jest.fn().mockResolvedValueOnce([]);

      const populate = jest
        .fn()
        .mockReturnValue({ populate: jest.fn().mockReturnValue({ exec }) });
      const limit = jest.fn().mockReturnValue({ populate });
      const skip = jest.fn().mockReturnValue({ limit });
      PostModel.find = jest.fn().mockReturnValueOnce({ skip });
      const result = await repo.query();
      expect(exec).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  test('Then the queryById method should be used', async () => {
    const mockId = '1';
    const mockPost = {
      id: '1',
      userName: 'Javi',
      email: 'javito@email.com',
      password: '',
      createdPost: [],
      favortitePost: [],
    };

    const exec = jest.fn().mockResolvedValueOnce(mockPost);
    const secondPopulate = jest.fn().mockReturnValue({ exec });
    const firstPopulate = jest
      .fn()
      .mockReturnValue({ populate: secondPopulate });

    PostModel.findById = jest
      .fn()
      .mockReturnValueOnce({ populate: firstPopulate });

    const result = await repo.queryById(mockId);
    expect(PostModel.findById).toHaveBeenCalledWith(mockId);
    expect(exec).toHaveBeenCalled();
    expect(result).toEqual(mockPost);
  });

  test('Then the create method should be used', async () => {
    const mockPost = {
      userName: 'Nitin',
      email: 'nitin@email.com',
      password: '',
      createdPost: [],
      favortitePost: [],
    } as unknown as Post;

    PostModel.create = jest.fn().mockReturnValueOnce(mockPost);
    const result = await repo.create(mockPost);
    expect(PostModel.create).toHaveBeenCalled();
    expect(result).toEqual(mockPost);
  });

  test('Then the update method should be used', async () => {
    const mockId = '1';
    const mockPost = { id: '1', userName: 'Lomito' };
    const updatedPost = { id: '1', userName: 'Lomete' };
    const exec = jest.fn().mockResolvedValueOnce(updatedPost);
    const populate = jest.fn().mockReturnValueOnce({ exec });
    PostModel.findByIdAndUpdate = jest.fn().mockReturnValueOnce({
      populate,
    });
    const result = await repo.update(mockId, mockPost);
    expect(PostModel.findByIdAndUpdate).toHaveBeenCalled();
    expect(result).toEqual(updatedPost);
  });

  describe('When the search method is called', () => {
    test('Then PostModel.find should have been called', async () => {
      const mockData = { key: 'userName', value: 'TestPost' };
      const mockPosts = [
        { userName: 'TestPost', email: 'testuser@email.com', passwd: 'passwd' },
      ];
      const exec = jest.fn().mockResolvedValueOnce(mockPosts);
      PostModel.find = jest.fn().mockReturnValueOnce({ exec });

      const result = await repo.search(mockData);

      expect(PostModel.find).toHaveBeenCalledWith({
        [mockData.key]: mockData.value,
      });
      expect(exec).toHaveBeenCalled();
      expect(result).toEqual(mockPosts);
    });
  });

  describe('When queryById is called with an invalid id', () => {
    test('Then it should throw a 404 HttpError', async () => {
      const mockId = 'invalidId';
      const error = new HttpError(404, 'Not found', 'Bad id for the query');
      const exec = jest.fn().mockResolvedValueOnce(null);
      const secondPopulate = jest.fn().mockReturnValue({ exec });
      const firstPopulate = jest
        .fn()
        .mockReturnValue({ populate: secondPopulate });

      PostModel.findById = jest
        .fn()
        .mockReturnValueOnce({ populate: firstPopulate });

      await expect(repo.queryById(mockId)).rejects.toThrow(error);
    });
  });

  describe('When update is called with an invalid id', () => {
    test('Then it should throw a 404 HttpError', async () => {
      const mockId = 'invalidId';
      const mockPost = { userName: 'testPost' } as unknown as Post;

      const error = new HttpError(404, 'Not found', 'Bad id for the update');

      const exec = jest.fn().mockResolvedValueOnce(null);
      const populate = jest.fn().mockReturnValueOnce({ exec });

      PostModel.findByIdAndUpdate = jest.fn().mockReturnValue({ populate });

      await expect(repo.update(mockId, mockPost)).rejects.toThrow(error);
    });
  });

  describe('When delete is called with a valid id', () => {
    test('Then it should delete the user', async () => {
      const mockId = 'validId';
      PostModel.findByIdAndDelete = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      await repo.delete(mockId);
      expect(PostModel.findByIdAndDelete).toHaveBeenCalledWith(mockId);
    });
  });

  describe('When delete is called with an invalid id', () => {
    test('Then it should throw a 404 HttpError', async () => {
      const mockId = 'invalidId';
      PostModel.findByIdAndDelete = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(repo.delete(mockId)).rejects.toThrow(HttpError);
      await expect(repo.delete(mockId)).rejects.toThrow(
        'Bad id for the delete'
      );
    });
  });

  describe('When count is called', () => {
    test('Then it should return the number of users', async () => {
      const exec = jest.fn().mockResolvedValueOnce(10);
      PostModel.countDocuments = jest.fn().mockReturnValueOnce({ exec });

      const result = await repo.count();
      await expect(result).toBe(10);
    });
  });

  describe('When the query methid is called', () => {
    test('It should return all funny post in the database', async () => {
      const mockFlair = 'funny';

      const queryObj = {} as any;
      const skip = jest.fn().mockReturnThis();
      const limit = jest.fn().mockReturnThis();
      const populate = jest.fn().mockReturnThis();
      const exec = jest.fn().mockResolvedValueOnce([]);

      PostModel.find = jest.fn().mockReturnValue(queryObj);
      queryObj.skip = skip;
      queryObj.limit = limit;
      queryObj.populate = populate;
      queryObj.exec = exec;

      await repo.query(1, 3, mockFlair);

      expect(skip).toHaveBeenCalled();
      expect(limit).toHaveBeenCalled();
      expect(populate).toHaveBeenCalledWith('owner');
      expect(exec).toHaveBeenCalled();
    });
  });

  describe('When the count methid is called', () => {
    test('should return the count of all funny post when the flair is given', async () => {
      const flair = 'funny';

      const queryObj = {} as any;
      const exec = jest.fn().mockResolvedValueOnce(0);

      PostModel.countDocuments = jest.fn().mockReturnValue(queryObj);
      queryObj.exec = exec;

      const result = await repo.count(flair);

      expect(exec).toHaveBeenCalled();
      expect(result).toBe(0);
    });
  });
});
