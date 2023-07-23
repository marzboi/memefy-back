import { readFile } from 'fs/promises';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { firebaseConfig } from '../config.js';
import {
  FirebaseStorage,
  StorageReference,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from 'firebase/storage';

export class FireBase {
  app: FirebaseApp;
  storage: FirebaseStorage;
  fileRef!: StorageReference;

  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.storage = getStorage(this.app);
  }

  async uploadFile(fileName: string) {
    const url = 'public/uploads/' + fileName;
    const fileBuffer = await readFile(url);
    this.fileRef = ref(this.storage, url);
    await uploadBytes(this.fileRef, fileBuffer);
    return getDownloadURL(this.fileRef);
  }
}
