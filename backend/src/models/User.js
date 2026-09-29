import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { isDbConnected, getStore } from '../config/db.js';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  avatarUrl: { type: String, default: '' },
  qoneqtHandle: { type: String, default: '@creator' },
  createdAt: { type: Date, default: Date.now },
});

const MongooseUser = mongoose.model('User', UserSchema);

export class User {
  static async findOne(query) {
    if (isDbConnected()) {
      return await MongooseUser.findOne(query);
    }
    const store = getStore();
    return store.users.find(u => {
      for (const k in query) {
        if (u[k] !== query[k]) return false;
      }
      return true;
    }) || null;
  }

  static async create(data) {
    if (isDbConnected()) {
      return await MongooseUser.create(data);
    }
    const store = getStore();
    const newUser = {
      _id: uuidv4(),
      createdAt: new Date(),
      avatarUrl: '',
      qoneqtHandle: '@creator',
      ...data
    };
    store.users.push(newUser);
    return newUser;
  }
}

export default User;
