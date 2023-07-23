import { PostModel } from './post.mongo.model.js';
import createDebug from 'debug';
import { Post } from '../entities/post.js';
import { Repo } from './repo.js';
import { HttpError } from '../types/http.error.js';
const debug = createDebug('FinalMeme:PostRepo');

export class PostRepo implements Repo<Post> {
  constructor() {
    debug('Post Repo');
  }

  async query(page = 1, limit = 3, flair?: string): Promise<Post[]> {
    page = Number(page as any);
    limit = Number(limit as any);

    const queryObj = {} as any;

    if (flair) {
      queryObj.flair = flair;
    }

    return PostModel.find(queryObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('owner')
      .populate('comments')
      .exec();
  }

  async search({
    key,
    value,
  }: {
    key: string;
    value: unknown;
  }): Promise<Post[]> {
    const result = await PostModel.find({ [key]: value }).exec();
    return result;
  }

  async queryById(id: string): Promise<Post> {
    const aData = await PostModel.findById(id)
      .populate('owner')
      .populate({ path: 'comments', populate: { path: 'owner' } })
      .exec();
    if (aData === null) {
      throw new HttpError(404, 'Not found', 'Bad id for the query');
    }

    return aData;
  }

  async create(data: Omit<Post, 'id'>): Promise<Post> {
    const newPost = await PostModel.create(data);
    return newPost;
  }

  async update(id: string, data: Partial<Post>): Promise<Post> {
    const newPost = await PostModel.findByIdAndUpdate(id, data, {
      new: true,
    })
      .populate('owner')
      .exec();

    if (newPost === null)
      throw new HttpError(404, 'Not found', 'Bad id for the update');

    return newPost;
  }

  async delete(id: string): Promise<void> {
    const result = await PostModel.findByIdAndDelete(id).exec();
    if (result === null)
      throw new HttpError(404, 'Not found', 'Bad id for the delete');
  }

  async count(flair?: string): Promise<number> {
    const queryObj = {} as any;

    if (flair) {
      queryObj.flair = flair;
    }

    return PostModel.countDocuments(queryObj).exec();
  }
}
