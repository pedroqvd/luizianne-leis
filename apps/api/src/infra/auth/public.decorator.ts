import { SetMetadata } from '@nestjs/common';

/**
 * Decorator que marca um endpoint como público (sem autenticação JWT).
 * Usado em: /health, SSE stream, e outros endpoints genuinamente públicos.
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
