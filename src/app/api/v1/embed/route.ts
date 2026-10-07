import { withApi } from '@/server/http/withApi';
import { embedQuerySchema, EmbedQueryInput } from '@/schemas/embed.schema';
import { handleEmbedRequest } from '@/server/services/embed.service';

export const dynamic = 'force-dynamic';

export const GET = withApi<never, EmbedQueryInput>(
  async () => {
    handleEmbedRequest();
  },
  {
    querySchema: embedQuerySchema,
  }
);
