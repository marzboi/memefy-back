import { hash, compare } from 'bcrypt';
import js from 'jsonwebtoken';
import { secret } from '../config.js';
import { HttpError } from '../types/http.error.js';

export type PayloadToken = {
  id: string;
  userName: string;
} & js.JwtPayload;

export class AuthServices {
  private static salt = 10;

  static createToken(payload: PayloadToken) {
    return js.sign(payload, secret!);
  }

  static verifyToken(token: string) {
    try {
      const result = js.verify(token, secret!);
      if (typeof result === 'string') {
        throw new HttpError(498, 'Invalid Token', result);
      }

      return result as PayloadToken;
    } catch (error) {
      throw new HttpError(498, 'Invalid Token', (error as Error).message);
    }
  }

  static hash(value: string) {
    return hash(value, AuthServices.salt);
  }

  static compare(value: string, hash: string) {
    return compare(value, hash);
  }
}
