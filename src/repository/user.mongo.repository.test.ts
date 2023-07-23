import { User } from '../entities/user';
import { HttpError } from '../types/http.error.js';
import { UserModel } from './user.mongo.model';
import { UserRepo } from './user.mongo.repository';

jest.mock('./user.mongo.model');

describe('Given the UserRepo class', () => {
  const repo = new UserRepo();
  describe('When it has been instantiated', () => {
    test('Then the query method should be used', async () => {
      const repo = new UserRepo();
      const mockData = [{}];
      const exec = jest.fn().mockResolvedValueOnce(mockData);
      const populate = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValueOnce({ exec }),
      });

      UserModel.find = jest.fn().mockReturnValueOnce({ populate });

      const result = await repo.query();
      expect(UserModel.find).toHaveBeenCalled();
      expect(exec).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });

  test('Then the queryById method should be used', async () => {
    const mockId = '1';
    const mockUser = {
      id: '1',
      userName: 'Nitin',
      email: 'nitin@email.com',
      password: '',
      createdPost: [],
      favortitePost: [],
    };

    const exec = jest.fn().mockResolvedValueOnce(mockUser);
    const populate = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValueOnce({ exec }),
    });

    UserModel.findById = jest.fn().mockReturnValueOnce({ populate });

    const result = await repo.queryById(mockId);
    expect(UserModel.findById).toHaveBeenCalledWith(mockId);
    expect(exec).toHaveBeenCalled();
    expect(result).toEqual(mockUser);
  });

  test('Then the create method should be used', async () => {
    const mockUser = {
      userName: 'Nitin',
      email: 'nitin@email.com',
      password: '',
      createdPost: [],
      favortitePost: [],
    } as unknown as User;

    UserModel.create = jest.fn().mockReturnValueOnce(mockUser);
    const result = await repo.create(mockUser);
    expect(UserModel.create).toHaveBeenCalled();
    expect(result).toEqual(mockUser);
  });

  test('Then the update method should be used', async () => {
    const mockId = '1';
    const mockUser = { id: '1', userName: 'Nitin' };
    const updatedUser = { id: '1', userName: 'Marco' };
    const exec = jest.fn().mockResolvedValueOnce(updatedUser);
    UserModel.findByIdAndUpdate = jest.fn().mockReturnValueOnce({
      exec,
    });
    const result = await repo.update(mockId, mockUser);
    expect(UserModel.findByIdAndUpdate).toHaveBeenCalled();
    expect(result).toEqual(updatedUser);
  });

  describe('When the search method is called', () => {
    test('Then UserModel.find should have been called', async () => {
      const mockData = { key: 'userName', value: 'TestUser' };
      const mockUsers = [
        { userName: 'TestUser', email: 'testuser@email.com', passwd: 'passwd' },
      ];
      const exec = jest.fn().mockResolvedValueOnce(mockUsers);
      UserModel.find = jest.fn().mockReturnValueOnce({ exec });

      const result = await repo.search(mockData);

      expect(UserModel.find).toHaveBeenCalledWith({
        [mockData.key]: mockData.value,
      });
      expect(exec).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('When queryById is called with an invalid id', () => {
    test('Then it should throw a 404 HttpError', async () => {
      const mockId = 'invalidId';
      const error = new HttpError(404, 'Not found', 'Bad id for the query');
      const exec = jest.fn().mockResolvedValueOnce(null);
      const populate = jest.fn().mockReturnValueOnce({
        populate: jest.fn().mockReturnValueOnce({ exec }),
      });
      UserModel.findById = jest.fn().mockReturnValueOnce({ populate });

      await expect(repo.queryById(mockId)).rejects.toThrow(error);
    });
  });

  describe('When update is called with an invalid id', () => {
    test('Then it should throw a 404 HttpError', async () => {
      const mockId = 'invalidId';
      const mockUser = { userName: 'testUser' };

      UserModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(repo.update(mockId, mockUser)).rejects.toThrow(HttpError);
      await expect(repo.update(mockId, mockUser)).rejects.toThrow(
        'Bad id for the update'
      );
    });
  });

  describe('When delete is called with a valid id', () => {
    test('Then it should delete the user', async () => {
      const mockId = 'validId';
      UserModel.findByIdAndDelete = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      await repo.delete(mockId);
      expect(UserModel.findByIdAndDelete).toHaveBeenCalledWith(mockId);
    });
  });

  describe('When delete is called with an invalid id', () => {
    test('Then it should throw a 404 HttpError', async () => {
      const mockId = 'invalidId';
      UserModel.findByIdAndDelete = jest.fn().mockReturnValue({
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
      UserModel.countDocuments = jest.fn().mockReturnValueOnce({ exec });

      const result = await repo.count();
      await expect(result).toBe(10);
    });
  });
});
