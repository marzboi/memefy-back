import { User } from './user';
import { Image } from './image';

export type Post = {
  id: string;
  description: string;
  image: Image;
  flair: string;
  owner: User;
  comments: Comment[];
};

export type Comment = {
  comment: string;
  owner: User;
};
