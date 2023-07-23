import mongoose from 'mongoose';
import { user, pass, db } from '../config.js';

export const dbConnect = () => {
  const uri = `mongodb+srv://${user}:${pass}@cluster0.n23vn4h.mongodb.net/${db}?retryWrites=true&w=majority`;
  return mongoose.connect(uri);
};
