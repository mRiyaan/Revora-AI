export type PropertyId = 'HOTEL001' | 'HOTEL002' | 'HOTEL003';

export interface PropertyConfig {
  propertyId: PropertyId;
  name: string;
  city: string;
  address: string;
  googleAccountId: string;
  googleLocationId: string;
  googleLocationPath: string;
  bookingPropertyId: string;
  tripadvisorLocationId: number;
}

export const PROPERTIES: PropertyConfig[] = [
  {
    propertyId: 'HOTEL001',
    name: 'THE LEELA PALACE BANGALORE',
    city: 'Bengaluru',
    address: '23 HAL Old Airport Road, Bengaluru 560008',
    googleAccountId: 'acc-aurum-01',
    googleLocationId: 'loc-blr-001',
    googleLocationPath: 'accounts/acc-aurum-01/locations/loc-blr-001',
    bookingPropertyId: '800101',
    tripadvisorLocationId: 187147,
  },
  {
    propertyId: 'HOTEL002',
    name: 'The Leela Goa',
    city: 'Goa',
    address: 'Mobor, Cavelossim, South Goa 403731',
    googleAccountId: 'acc-aurum-01',
    googleLocationId: 'loc-goa-002',
    googleLocationPath: 'accounts/acc-aurum-01/locations/loc-goa-002',
    bookingPropertyId: '800102',
    tripadvisorLocationId: 188151,
  },
  {
    propertyId: 'HOTEL003',
    name: 'The Leela Palace Jaipur',
    city: 'Jaipur',
    address: 'Jaipur-Delhi Highway, Kukas, Jaipur 302028',
    googleAccountId: 'acc-aurum-01',
    googleLocationId: 'loc-jpr-003',
    googleLocationPath: 'accounts/acc-aurum-01/locations/loc-jpr-003',
    bookingPropertyId: '800103',
    tripadvisorLocationId: 190420,
  },
];

export const PROPERTY_BY_ID: Record<PropertyId, PropertyConfig> = {
  HOTEL001: PROPERTIES[0],
  HOTEL002: PROPERTIES[1],
  HOTEL003: PROPERTIES[2],
};

export function resolvePropertyByExternalId(
  platform: 'google' | 'booking' | 'tripadvisor',
  externalLocationId: string | number
): PropertyConfig | undefined {
  const key = String(externalLocationId);
  return PROPERTIES.find((p) => {
    if (platform === 'google') {
      return p.googleLocationId === key || p.googleLocationPath === key;
    }
    if (platform === 'booking') {
      return p.bookingPropertyId === key;
    }
    return String(p.tripadvisorLocationId) === key;
  });
}
