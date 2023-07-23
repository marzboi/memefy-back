import { getDownloadURL } from 'firebase/storage';
import { FireBase } from './firebase';
import { readFile } from 'fs/promises';

jest.mock('firebase/storage');
jest.mock('fs/promises');

describe('Given FireBase class', () => {
  describe('When it is instantiated', () => {
    const fireBase = new FireBase();

    test('Then uploadFile method should be called', async () => {
      await fireBase.uploadFile('test');
      expect(readFile).toHaveBeenCalled();
      expect(getDownloadURL).toHaveBeenCalled();
    });
  });
});
