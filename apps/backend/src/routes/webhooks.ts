import { Router } from 'express';
import { CanonicalReview } from '@revora/shared';
import { getConnector } from '../connectors/connectorRegistry';
import { ingestCanonicalReview } from '../services/ingestService';

export const webhooksRouter = Router();

webhooksRouter.post('/google', async (req, res) => {
  try {
    const google = getConnector('google');
    const event = await google.verifyWebhook({
      headers: req.headers,
      body: req.body,
    });

    let review: CanonicalReview | null = await google.fetchReview(
      event.propertyId,
      event.externalReviewId
    );

    // Allow inline review fallback in webhook test payloads when mock-google isn't running
    if (!review && req.body?.fallbackReview) {
      review = req.body.fallbackReview as CanonicalReview;
    }

    if (!review) {
      res.status(404).json({
        error: `Referenced Google review '${event.externalReviewId}' not found on mock GBP API or loopback store.`,
      });
      return;
    }

    const result = ingestCanonicalReview(review, 'google_pubsub_webhook');
    res.status(202).json({ accepted: true, event, ...result });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : 'Invalid Google Pub/Sub webhook payload',
    });
  }
});
