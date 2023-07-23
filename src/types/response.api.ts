import { User } from '../entities/user';

export type ApiResponse = {
  count: number;
  items: { [key: string]: any }[];
  previous: string | null;
  next: string | null;
};

export type LoginResponse = {
  token: string;
  user: User;
};
