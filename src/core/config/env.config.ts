import dotenv from 'dotenv';
dotenv.config();

export const config = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',

  users: {
    admin: {
      email: 'admin@taskflow.com',
      password: 'Admin123!',
      name: 'Admin User',
      role: 'admin',
    },
    manager: {
      email: 'sarah@taskflow.com',
      password: 'Sarah123!',
      name: 'Sarah Chen',
      role: 'manager',
    },
    member: {
      email: 'james@taskflow.com',
      password: 'James123!',
      name: 'James Wilson',
      role: 'member',
    },
  },
};
