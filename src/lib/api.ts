import ky, { type KyInstance } from 'ky';

export function createApiClient(baseUrl: string): KyInstance {
  return ky.create({
    prefixUrl: baseUrl,
    timeout: 15000,
  });
}
