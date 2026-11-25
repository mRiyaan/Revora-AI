import { PlatformId, ReviewConnector } from '@revora/shared';
import { GoogleConnector, isGoogleMockOnline } from './googleConnector';
import { BookingConnector, isBookingMockOnline } from './bookingConnector';
import {
  TripadvisorConnector,
  isTripadvisorMockOnline,
} from './tripadvisorConnector';
import { CONFIG } from '../config';

const googleConnector = new GoogleConnector();
const bookingConnector = new BookingConnector();
const tripadvisorConnector = new TripadvisorConnector();

export function getConnector(platform: PlatformId): ReviewConnector {
  if (platform === 'google') return googleConnector;
  if (platform === 'booking') return bookingConnector;
  return tripadvisorConnector;
}

export function getAllConnectors(): ReviewConnector[] {
  return [googleConnector, bookingConnector, tripadvisorConnector];
}

export async function getConnectorHealthSummary() {
  const [googleOnline, bookingOnline, taOnline] = await Promise.all([
    isGoogleMockOnline(),
    isBookingMockOnline(),
    isTripadvisorMockOnline(),
  ]);

  return [
    {
      platform: 'google' as const,
      displayName: 'Google Business Profile',
      port: 3001,
      url: CONFIG.mockGoogleUrl,
      transportMode: googleOnline ? 'live_mock_http' : 'sandbox_loopback',
      capabilities: googleConnector.capabilities,
    },
    {
      platform: 'booking' as const,
      displayName: 'Booking.com Connectivity',
      port: 3002,
      url: CONFIG.mockBookingUrl,
      transportMode: bookingOnline ? 'live_mock_http' : 'sandbox_loopback',
      capabilities: bookingConnector.capabilities,
    },
    {
      platform: 'tripadvisor' as const,
      displayName: 'Tripadvisor Terra',
      port: 3003,
      url: CONFIG.mockTripadvisorUrl,
      transportMode: taOnline ? 'live_mock_http' : 'sandbox_loopback',
      capabilities: tripadvisorConnector.capabilities,
    },
  ];
}
