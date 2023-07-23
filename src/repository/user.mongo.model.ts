import { Schema, model } from 'mongoose';
import { User } from '../entities/user.js';

const userSchema = new Schema<User>({
  userName: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  passwd: {
    type: String,
    required: true,
  },
  avatar: {
    type: {
      urlOriginal: { type: String },
      url: { type: String },
      mimetype: { type: String },
      size: { type: Number },
    },
    required: true,
  },
  createdPost: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
  ],
  favoritePost: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
  ],
});

userSchema.set('toJSON', {
  transform(_document, returnObject) {
    returnObject.id = returnObject._id;
    delete returnObject.__v;
    delete returnObject._id;
    delete returnObject.passwd;
  },
});

export const UserModel = model('User', userSchema, 'users');
