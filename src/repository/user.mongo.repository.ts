import { UserModel } from './user.mongo.model.js';
import createDebug from 'debug';
import { Repo } from './repo.js';
import { User } from '../entities/user.js';
import { HttpError } from '../types/http.error.js';
const debug = createDebug('FinalMeme:UserRepo');

export class UserRepo implements Repo<User> {
  constructor() {
    debug('Instantiated', UserModel);
  }

  async query(): Promise<User[]> {
    const aData = await UserModel.find()
      .populate('createdPost')
      .populate('favoritePost')
      .exec();
    return aData;
  }

  async queryById(id: string): Promise<User> {
    const aData = await UserModel.findById(id)
      .populate({
        path: 'createdPost',
        populate: { path: 'owner' },
      })
      .populate({
        path: 'favoritePost',
        populate: { path: 'owner' },
      })
      .exec();
    if (aData === null) {
      throw new HttpError(404, 'Not found', 'Bad id for the query');
    }

    return aData;
  }

  async search({
    key,
    value,
  }: {
    key: string;
    value: unknown;
  }): Promise<User[]> {
    const result = await UserModel.find({ [key]: value }).exec();
    return result;
  }

  async create(data: Omit<User, 'id'>): Promise<User> {
    const newUser = await UserModel.create(data);
    return newUser;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const newUser = await UserModel.findByIdAndUpdate(id, data, {
      new: true,
    }).exec();

    if (newUser === null)
      throw new HttpError(404, 'Not found', 'Bad id for the update');

    return newUser;
  }

  async delete(id: string): Promise<void> {
    const result = await UserModel.findByIdAndDelete(id).exec();
    if (result === null)
      throw new HttpError(404, 'Not found', 'Bad id for the delete');
  }

  async count(): Promise<number> {
    return UserModel.countDocuments().exec();
  }
}
