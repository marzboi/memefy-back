import { HttpError } from '../types/http.error.js';
import { AuthServices, PayloadToken } from './auth.js';
import jwt from 'jsonwebtoken';
import { compare, hash } from 'bcrypt';

jest.mock('jsonwebtoken');
jest.mock('bcrypt');

describe('Given the AuthServices class', () => {
  describe('When I use createJWT method', () => {
    test('Then the JWT sign method should be called', () => {
      const mockPayload = {} as PayloadToken;
      AuthServices.createToken(mockPayload);
      expect(jwt.sign).toHaveBeenCalled();
    });

    test('When I use verifJWTGettingPayload method', () => {
      const mockToken = 'token';
      AuthServices.verifyToken(mockToken);
      expect(jwt.verify).toHaveBeenCalled();
    });

    test('When the result of the jwt.verify function returns a string and gives an error', () => {
      const mockResult = 'test';
      const mockToken = 'token';
      const error = new HttpError(498, 'Invalid Token', mockResult);
      const mockVerify = (jwt.verify as jest.Mock).mockReturnValueOnce(
        mockResult
      );
      expect(() => AuthServices.verifyToken(mockToken)).toThrow(error);
      expect(mockVerify).toHaveBeenCalled();
    });

    test('When I use hash method', async () => {
      const mockValue = 'password';
      const mockHashedValue = 'hashedPassword';
      (hash as jest.Mock).mockResolvedValueOnce(mockHashedValue);

      const result = await AuthServices.hash(mockValue);

      expect(hash).toHaveBeenCalled();
      expect(result).toBe(mockHashedValue);
    });

    test('When I use compare method', async () => {
      const mockValue = 'password';
      const mockHashedValue = 'hashedPassword';
      (compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await AuthServices.compare(mockValue, mockHashedValue);

      expect(compare).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });
});
