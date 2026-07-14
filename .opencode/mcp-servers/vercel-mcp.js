#!/usr/bin/env node
// CineWeave Vercel MCP Server
// Uses the official MCP SDK over stdio transport.

import 'dotenv/config';
import https from 'node:https';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID || '';

if (!VERCEL_TOKEN) {
  console.error('Missing VERCEL_TOKEN environment variable.');
  process.exit(1);
}

function vercelApi(apiPath, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const fullPath = `/v1${apiPath}${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`;
    const options = {
      hostname: 'api.vercel.com',
      path: fullPath,
      method,
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const server = new McpServer({
  name: 'cineweave-vercel',
  version: '1.0.0',
});

server.tool(
  'deploy',
  'Deploy the CineWeave app to Vercel',
  { name: z.string().optional().default('cineweave') },
  async ({ name }) => {
    const body = {
      name,
      projectSettings: {
        framework: 'vite',
        buildCommand: 'npm run build',
        outputDirectory: 'dist',
        installCommand: 'npm install',
      },
    };
    const result = await vercelApi('/deployments', 'POST', body);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'list_deployments',
  'List all Vercel deployments',
  {},
  async () => {
    const result = await vercelApi('/deployments');
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'get_deployment',
  'Get details of a specific deployment',
  { id: z.string() },
  async ({ id }) => {
    const result = await vercelApi(`/deployments/${id}`);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'set_env',
  'Set a Vercel environment variable',
  {
    key: z.string(),
    value: z.string(),
    target: z.array(z.string()).optional().default(['production', 'preview', 'development']),
  },
  async ({ key, value, target }) => {
    const body = { key, value, target, type: 'encrypted' };
    const result = await vercelApi('/env', 'POST', body);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'list_env',
  'List all Vercel environment variables',
  {},
  async () => {
    const result = await vercelApi('/env');
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'get_project',
  'Get Vercel project details (defaults to cineweave)',
  { name: z.string().optional().default('cineweave') },
  async ({ name }) => {
    const result = await vercelApi(`/projects/${name}`);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'list_domains',
  'List custom domains for a Vercel project (defaults to cineweave)',
  { project: z.string().optional().default('cineweave') },
  async ({ project }) => {
    const result = await vercelApi(`/projects/${project}/domains`);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  'add_domain',
  'Add a custom domain to a Vercel project (defaults to cineweave)',
  {
    project: z.string().optional().default('cineweave'),
    domain: z.string(),
  },
  async ({ project, domain }) => {
    const result = await vercelApi(`/projects/${project}/domains`, 'POST', { name: domain });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

// ── Start server over stdio ──
const transport = new StdioServerTransport();
await server.connect(transport);