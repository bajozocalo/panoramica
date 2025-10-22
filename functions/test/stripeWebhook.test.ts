import firebaseFunctionsTest from 'firebase-functions-test';
const test = firebaseFunctionsTest({}, '../panoramica-digital-firebase-adminsdk-fbsvc-427df964e0.json');
import * as admin from 'firebase-admin';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { handleStripeWebhook } from '../src/stripeWebhook';
import Stripe from 'stripe';

describe('Stripe Webhooks', () => {
  let adminStub: sinon.SinonStub;
  let firestoreStub: sinon.SinonStub;

  before(() => {
    adminStub = sinon.stub(admin, 'initializeApp');
  });

  after(() => {
    adminStub.restore();
    test.cleanup();
  });

  beforeEach(() => {
    firestoreStub = sinon.stub(admin, 'firestore');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('handleStripeWebhook', () => {
    it('should handle checkout.session.completed and add credits to the user', async () => {
      // Mock Firestore
      const userRef = { update: sinon.stub().resolves() };
      const docStub = sinon.stub().returns(userRef);
      firestoreStub.get(() => () => ({
        collection: (path: string) => {
          if (path === 'users') return { doc: docStub };
          return {};
        },
        FieldValue: {
          increment: sinon.stub(),
          serverTimestamp: sinon.stub()
        }
      }));

      // Mock Stripe event
      const mockEvent = {
        id: 'evt_test_123',
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            object: 'checkout.session',
            metadata: {
              userId: 'test-user',
              priceId: 'price_starter'
            },
            customer: 'cus_test_123'
          }
        }
      } as any as Stripe.Event;

      // Mock Stripe webhook construction
      const constructEventStub = sinon.stub(Stripe.webhooks, 'constructEvent').returns(mockEvent);

      const req = {
        headers: { 'stripe-signature': 'test_signature' },
        rawBody: Buffer.from('test_body')
      };
      const res = {
        json: sinon.stub(),
        status: sinon.stub().returnsThis(),
        send: sinon.stub()
      };

      await handleStripeWebhook(req as any, res as any);

      expect(res.json.calledWith({ received: true })).to.be.true;
      expect(docStub.calledWith('test-user')).to.be.true;
      expect(userRef.update.calledOnce).to.be.true;

      constructEventStub.restore();
    });

    it('should return a 400 error if the webhook signature is invalid', async () => {
      // Mock Stripe webhook construction to throw an error
      const constructEventStub = sinon.stub(Stripe.webhooks, 'constructEvent').throws(new Error('Invalid signature'));

      const req = {
        headers: { 'stripe-signature': 'invalid_signature' },
        rawBody: Buffer.from('test_body')
      };
      const res = {
        json: sinon.stub(),
        status: sinon.stub().returnsThis(),
        send: sinon.stub()
      };

      await handleStripeWebhook(req as any, res as any);

      expect(res.status.calledWith(400)).to.be.true;

      constructEventStub.restore();
    });
  });
});
