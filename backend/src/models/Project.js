import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { isDbConnected, getStore } from '../config/db.js';

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  userId: { type: String, default: 'default_user' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const MongooseProject = mongoose.model('Project', ProjectSchema);

export class Project {
  static async find(query = {}) {
    if (isDbConnected()) {
      return await MongooseProject.find(query).sort({ updatedAt: -1 });
    }
    const store = getStore();
    return store.projects;
  }

  static async findById(id) {
    if (isDbConnected()) {
      return await MongooseProject.findById(id);
    }
    const store = getStore();
    return store.projects.find(p => p._id === id || p.id === id) || null;
  }

  static async create(data) {
    if (isDbConnected()) {
      return await MongooseProject.create(data);
    }
    const store = getStore();
    const newProject = {
      _id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data
    };
    store.projects.push(newProject);
    return newProject;
  }
}

export default Project;
