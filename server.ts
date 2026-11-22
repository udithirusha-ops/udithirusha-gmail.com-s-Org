import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const NOTION_VERSION = '2022-06-28';

app.use(express.json({ limit: '2mb' }));

async function notionFetch(
  token: string,
  endpoint: string,
  method: string,
  body?: unknown
) {
  const response = await fetch(`https://api.notion.com/v1${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      (json as { message?: string }).message ||
      `Notion API error (${response.status})`;
    throw new Error(message);
  }
  return json;
}

app.post('/api/notion/databases', async (req, res) => {
  const { token } = req.body as { token?: string };
  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'Notion Integration Token is required.' });
    return;
  }

  try {
    const data = (await notionFetch(token.trim(), '/search', 'POST', {
      filter: { value: 'database', property: 'object' },
      page_size: 100,
    })) as {
      results?: Array<{
        id: string;
        title?: Array<{ plain_text?: string }>;
        properties?: Record<string, { type: string }>;
      }>;
    };

    const databases = (data.results ?? []).map((db) => ({
      id: db.id,
      title:
        (db.title ?? []).map((t) => t.plain_text ?? '').join('').trim() ||
        'Untitled Database',
      properties: Object.entries(db.properties ?? {}).map(([name, meta]) => ({
        name,
        type: meta.type,
      })),
    }));

    res.json({ databases });
  } catch (error) {
    res.status(502).json({
      error:
        error instanceof Error
          ? error.message
          : 'Failed to connect to Notion API.',
    });
  }
});

app.post('/api/notion/query', async (req, res) => {
  const { token, databaseId } = req.body as {
    token?: string;
    databaseId?: string;
  };
  if (!token || !databaseId) {
    res
      .status(400)
      .json({ error: 'Both token and databaseId are required.' });
    return;
  }

  try {
    const allResults: unknown[] = [];
    let cursor: string | undefined = undefined;
    let guard = 0;

    do {
      const payload: Record<string, unknown> = { page_size: 100 };
      if (cursor) payload.start_cursor = cursor;

      const data = (await notionFetch(
        token.trim(),
        `/databases/${encodeURIComponent(databaseId.trim())}/query`,
        'POST',
        payload
      )) as {
        results?: unknown[];
        has_more?: boolean;
        next_cursor?: string | null;
      };

      if (Array.isArray(data.results)) {
        allResults.push(...data.results);
      }
      cursor = data.has_more && data.next_cursor ? data.next_cursor : undefined;
      guard++;
    } while (cursor && guard < 10);

    res.json({ results: allResults });
  } catch (error) {
    res.status(502).json({
      error:
        error instanceof Error
          ? error.message
          : 'Failed to query Notion database.',
    });
  }
});

app.post('/api/notion/page', async (req, res) => {
  const { token, pageId, properties } = req.body as {
    token?: string;
    pageId?: string;
    properties?: Record<string, unknown>;
  };
  if (!token || !pageId || !properties) {
    res.status(400).json({ error: 'token, pageId, and properties are required.' });
    return;
  }

  try {
    const updated = await notionFetch(
      token.trim(),
      `/pages/${encodeURIComponent(pageId.trim())}`,
      'PATCH',
      { properties }
    );
    res.json({ page: updated });
  } catch (error) {
    res.status(502).json({
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update Notion page.',
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  if (!isProd) {
    const disableHmr = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: disableHmr ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found. Run npm run build.');
      }
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Studiess server running on http://localhost:${PORT}`);
  });
}

startServer();
