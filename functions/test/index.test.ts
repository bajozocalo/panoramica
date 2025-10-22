import firebaseFunctionsTest from 'firebase-functions-test';
const test = firebaseFunctionsTest({}, '../panoramica-digital-firebase-adminsdk-fbsvc-427df964e0.json');
test.mockConfig({
  stripe: {
    secret_key: 'test_secret_key',
    webhook_secret: 'test_webhook_secret'
  }
});
import * as admin from 'firebase-admin';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { generateProductPhotos } from '../src/index';
import * as imageProcessing from '../src/imageProcessing';
import * as geminiService from '../src/geminiService';
import * as imagenService from '../src/imagenService';
import { __setVisionClient } from '../src/imageProcessing';

describe('Cloud Functions', () => {
  let adminStub: sinon.SinonStub;
  let firestoreStub: sinon.SinonStub;
  let storageStub: sinon.SinonStub;

  before(() => {
    adminStub = sinon.stub(admin, 'initializeApp');
    const mockedVisionClient = {
      objectLocalization: sinon.stub().resolves([{
        localizedObjectAnnotations: [{
          boundingPoly: {
            normalizedVertices: [{x:0, y:0}, {x:0, y:0}, {x:0, y:0}, {x:0, y:0}]
          }
        }]
      }])
    };
    __setVisionClient(mockedVisionClient);
    sinon.stub(imageProcessing, 'removeBackground').resolves(Buffer.from('test'));
    sinon.stub(geminiService, 'generatePrompts').resolves(['a photorealistic prompt']);
    sinon.stub(imagenService, 'generateImages').resolves([Buffer.from('generated-image')]);
  });

  after(() => {
    adminStub.restore();
    sinon.restore();
    test.cleanup();
  });

  describe('generateProductPhotos', () => {
    beforeEach(() => {
      firestoreStub = sinon.stub(admin, 'firestore');
      storageStub = sinon.stub(admin, 'storage');
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should throw an error if the user is not authenticated', async () => {
      const wrapped = test.wrap(generateProductPhotos);

      try {
        await wrapped({}, {});
      } catch (e: any) {
        expect(e.code).to.equal('unauthenticated');
        expect(e.message).to.equal('User must be authenticated');
      }
    });

    it('should throw an error if required fields are missing', async () => {
      const wrapped = test.wrap(generateProductPhotos);
      const context = {
        auth: {
          uid: 'test-user'
        }
      };

      try {
        await wrapped({}, { auth: context.auth });
      } catch (e: any) {
        expect(e.code).to.equal('invalid-argument');
        expect(e.message).to.equal('Missing required fields');
      }
    });

    it('should successfully generate images and return the result', async function() {
      this.timeout(5000);
      // Mock firestore
      const userDoc = { data: () => ({ credits: 100 }) };
      const userRef = { get: () => Promise.resolve(userDoc), update: () => Promise.resolve() };
      const generationsRef = { add: () => Promise.resolve() };
      firestoreStub.get(() => () => ({
        collection: (path: string) => {
          if (path === 'users') return { doc: () => userRef };
          if (path === 'generations') return { add: generationsRef.add };
          return {};
        },
        FieldValue: {
          increment: sinon.stub(),
          serverTimestamp: sinon.stub()
        }
      }));

      // Mock storage
      const file = { 
        download: () => Promise.resolve([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')]),
        save: () => Promise.resolve(),
        makePublic: () => Promise.resolve()
      };
      const bucket = { file: () => file };
      storageStub.get(() => () => ({ bucket: () => bucket }));

      const wrapped = test.wrap(generateProductPhotos);

      const data = {
        imageUrl: 'https://fake.url/image.jpg',
        productType: 'watch',
        scenes: ['white-seamless'],
        numberOfVariations: 1
      };

      const context = {
        auth: {
          uid: 'test-user'
        }
      };

      const result = await wrapped(data, context);

      expect(result.success).to.be.true;
      expect(result.images).to.be.an('array').with.lengthOf(1);
      expect(result.creditsUsed).to.equal(1);
    });

    it('should throw an error if the user has insufficient credits', async () => {
      // Mock firestore
      const userDoc = { data: () => ({ credits: 0 }) };
      const userRef = { get: () => Promise.resolve(userDoc), update: () => Promise.resolve() };
      firestoreStub.get(() => () => ({
        collection: (path: string) => {
          if (path === 'users') return { doc: () => userRef };
          return {};
        }
      }));

      const wrapped = test.wrap(generateProductPhotos);

      const data = {
        imageUrl: 'https://fake.url/image.jpg',
        productType: 'watch',
        scenes: ['white-seamless'],
        numberOfVariations: 1
      };

      const context = {
        auth: {
          uid: 'test-user'
        }
      };

      try {
        await wrapped(data, context);
      } catch (e: any) {
        expect(e.code).to.equal('failed-precondition');
        expect(e.message).to.equal('Insufficient credits. Need 1, have 0');
      }
    });

    it('should throw an error if removeBackground fails', async () => {
      // Mock firestore
      const userDoc = { data: () => ({ credits: 100 }) };
      const userRef = { get: () => Promise.resolve(userDoc), update: () => Promise.resolve() };
      firestoreStub.get(() => () => ({
        collection: (path: string) => {
          if (path === 'users') return { doc: () => userRef };
          return {};
        }
      }));

      // Mock storage
      const file = { 
        download: () => Promise.resolve([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')])
      };
      const bucket = { file: () => file };
      storageStub.get(() => () => ({ bucket: () => bucket }));

      // Stub removeBackground to throw an error
      const removeBackgroundStub = sinon.stub(imageProcessing, 'removeBackground').throws(new Error('Background removal failed'));

      const wrapped = test.wrap(generateProductPhotos);

      const data = {
        imageUrl: 'https://fake.url/image.jpg',
        productType: 'watch',
        scenes: ['white-seamless'],
        numberOfVariations: 1
      };

      const context = {
        auth: {
          uid: 'test-user'
        }
      };

      try {
        await wrapped(data, context);
      } catch (e: any) {
        expect(e.code).to.equal('internal');
        expect(e.message).to.equal('Generation failed: Background removal failed');
      }

      removeBackgroundStub.restore();
    });

    it('should throw an error if generatePrompts fails', async () => {
      // Mock firestore
      const userDoc = { data: () => ({ credits: 100 }) };
      const userRef = { get: () => Promise.resolve(userDoc), update: () => Promise.resolve() };
      firestoreStub.get(() => () => ({
        collection: (path: string) => {
          if (path === 'users') return { doc: () => userRef };
          return {};
        }
      }));

      // Mock storage
      const file = { 
        download: () => Promise.resolve([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')])
      };
      const bucket = { file: () => file };
      storageStub.get(() => () => ({ bucket: () => bucket }));

      // Stub generatePrompts to throw an error
      const generatePromptsStub = sinon.stub(geminiService, 'generatePrompts').throws(new Error('Prompt generation failed'));

      const wrapped = test.wrap(generateProductPhotos);

      const data = {
        imageUrl: 'https://fake.url/image.jpg',
        productType: 'watch',
        scenes: ['white-seamless'],
        numberOfVariations: 1
      };

      const context = {
        auth: {
          uid: 'test-user'
        }
      };

      try {
        await wrapped(data, context);
      } catch (e: any) {
        expect(e.code).to.equal('internal');
        expect(e.message).to.equal('Generation failed: Prompt generation failed');
      }

      generatePromptsStub.restore();
    });

    it('should throw an error if generateImages fails', async () => {
      // Mock firestore
      const userDoc = { data: () => ({ credits: 100 }) };
      const userRef = { get: () => Promise.resolve(userDoc), update: () => Promise.resolve() };
      firestoreStub.get(() => () => ({
        collection: (path: string) => {
          if (path === 'users') return { doc: () => userRef };
          return {};
        }
      }));

      // Mock storage
      const file = { 
        download: () => Promise.resolve([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64')])
      };
      const bucket = { file: () => file };
      storageStub.get(() => () => ({ bucket: () => bucket }));

      // Stub generateImages to throw an error
      const generateImagesStub = sinon.stub(imagenService, 'generateImages').throws(new Error('Image generation failed'));

      const wrapped = test.wrap(generateProductPhotos);

      const data = {
        imageUrl: 'https://fake.url/image.jpg',
        productType: 'watch',
        scenes: ['white-seamless'],
        numberOfVariations: 1
      };

      const context = {
        auth: {
          uid: 'test-user'
        }
      };

      try {
        await wrapped(data, context);
      } catch (e: any) {
        expect(e.code).to.equal('internal');
        expect(e.message).to.equal('Generation failed: Image generation failed');
      }

      generateImagesStub.restore();
    });
  });
});
