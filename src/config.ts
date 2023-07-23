import * as dotenv from 'dotenv';
dotenv.config();

export const user = process.env.DB_USER;
export const pass = process.env.DB_PASSWORD;
export const db = process.env.DB_NAME;
export const secret = process.env.JWS_SECRET;
export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: 'fotitos-front.firebaseapp.com',
  projectId: 'fotitos-front',
  storageBucket: 'fotitos-front.appspot.com',
  messagingSenderId: '645684530397',
  appId: '1:645684530397:web:57a0e5c90040bcf278df34',
};
