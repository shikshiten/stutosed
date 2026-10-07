import 'server-only';
import { AppError } from '@/server/http/errors';

export class GoneError extends AppError {
  constructor(message: string = 'The requested resource is permanently gone.') {
    super(message, 410, 'GONE');
  }
}

export function handleEmbedRequest(): never {
  throw new GoneError('The embed proxy has been permanently deprecated and disabled.');
}
