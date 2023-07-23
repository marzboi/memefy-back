import { Schema, model } from 'mongoose';
import { Post } from '../entities/post.js';

const postSchema = new Schema<Post>({
  description: {
    type: String,
    required: true,
  },
  image: {
    type: {
      urlOriginal: { type: String },
      url: { type: String },
      mimetype: { type: String },
      size: { type: Number },
    },
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  flair: {
    type: String,
    required: true,
  },
  comments: [
    {
      comment: { type: String },
      owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  ],
});

postSchema.set('toJSON', {
  transform(_document, returnObject) {
    returnObject.id = returnObject._id;
    delete returnObject.__v;
    delete returnObject._id;
    delete returnObject.passwd;
  },
});

export const PostModel = model('Post', postSchema, 'posts');
