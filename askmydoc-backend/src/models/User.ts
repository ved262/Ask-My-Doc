import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types';

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,      // creates a database index: no two users with one email
      lowercase: true,   // Vedant@x.com and vedant@x.com are the same person
      trim: true,
    },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);