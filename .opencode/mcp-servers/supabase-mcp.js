#!/usr/bin/env node
// CineWeave Supabase MCP Server
// Uses the official MCP SDK over stdio transport.

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_ fallbacks).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const server = new McpServer({
  name: 'cineweave-supabase',
  version: '1.0.0',
});

// ── Projects ──
server.tool(
  'list_projects',
  'List all CineWeave projects',
  {},
  async () => {
    const { data, error } = await supabase.from('projects').select('*').order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  'get_project',
  'Get a single project by ID',
  { id: z.string() },
  async ({ id }) => {
    const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  'create_project',
  'Create a new project',
  {
    user_id: z.string(),
    title: z.string(),
    tagline: z.string().optional().default(''),
    genre: z.string().optional().default(''),
    logline: z.string().optional().default(''),
  },
  async (params) => {
    const { data, error } = await supabase.from('projects').insert(params).select().single();
    if (error) throw new Error(error.message);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  'update_project',
  'Update a project (pass any updatable field)',
  {
    id: z.string(),
    title: z.string().optional(),
    tagline: z.string().optional(),
    genre: z.string().optional(),
    logline: z.string().optional(),
  },
  async ({ id, ...updates }) => {
    const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  'delete_project',
  'Delete a project by ID',
  { id: z.string() },
  async ({ id }) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { content: [{ type: 'text', text: JSON.stringify({ success: true }) }] };
  }
);

// ── Characters ──
server.tool(
  'list_characters',
  'List characters for a project',
  { project_id: z.string() },
  async ({ project_id }) => {
    const { data, error } = await supabase.from('characters').select('*').eq('project_id', project_id).order('created_at');
    if (error) throw new Error(error.message);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  'save_character',
  'Create or update a character (omit id to create)',
  {
    id: z.string().optional(),
    user_id: z.string(),
    project_id: z.string(),
    name: z.string(),
    role: z.string().optional().default('Protagonista'),
    description: z.string().optional().default(''),
    traits: z.array(z.string()).optional().default([]),
    backstory: z.string().optional().default(''),
    avatar: z.string().optional().default('amber'),
    notes: z.string().optional().default(''),
  },
  async ({ id, ...record }) => {
    let data, error;
    if (id) {
      ({ data, error } = await supabase.from('characters').update(record).eq('id', id).select().single());
    } else {
      ({ data, error } = await supabase.from('characters').insert(record).select().single());
    }
    if (error) throw new Error(error.message);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  'delete_character',
  'Delete a character by ID',
  { id: z.string() },
  async ({ id }) => {
    const { error } = await supabase.from('characters').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { content: [{ type: 'text', text: JSON.stringify({ success: true }) }] };
  }
);

// ── Locations ──
server.tool(
  'list_locations',
  'List locations for a project',
  { project_id: z.string() },
  async ({ project_id }) => {
    const { data, error } = await supabase.from('locations').select('*').eq('project_id', project_id).order('created_at');
    if (error) throw new Error(error.message);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  'save_location',
  'Create or update a location (omit id to create)',
  {
    id: z.string().optional(),
    user_id: z.string(),
    project_id: z.string(),
    name: z.string(),
    type: z.string().optional().default('INT.'),
    description: z.string().optional().default(''),
    timeOfDay: z.string().optional().default('NOITE'),
    mood: z.string().optional().default(''),
  },
  async ({ id, timeOfDay, ...rest }) => {
    const record = { ...rest, time_of_day: timeOfDay };
    let data, error;
    if (id) {
      ({ data, error } = await supabase.from('locations').update(record).eq('id', id).select().single());
    } else {
      ({ data, error } = await supabase.from('locations').insert(record).select().single());
    }
    if (error) throw new Error(error.message);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  'delete_location',
  'Delete a location by ID',
  { id: z.string() },
  async ({ id }) => {
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { content: [{ type: 'text', text: JSON.stringify({ success: true }) }] };
  }
);

// ── Objects ──
server.tool(
  'list_objects',
  'List objects for a project',
  { project_id: z.string() },
  async ({ project_id }) => {
    const { data, error } = await supabase.from('objects').select('*').eq('project_id', project_id).order('created_at');
    if (error) throw new Error(error.message);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  'save_object',
  'Create or update an object (omit id to create)',
  {
    id: z.string().optional(),
    user_id: z.string(),
    project_id: z.string(),
    name: z.string(),
    significance: z.string().optional().default(''),
    description: z.string().optional().default(''),
  },
  async ({ id, ...record }) => {
    let data, error;
    if (id) {
      ({ data, error } = await supabase.from('objects').update(record).eq('id', id).select().single());
    } else {
      ({ data, error } = await supabase.from('objects').insert(record).select().single());
    }
    if (error) throw new Error(error.message);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  'delete_object',
  'Delete an object by ID',
  { id: z.string() },
  async ({ id }) => {
    const { error } = await supabase.from('objects').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { content: [{ type: 'text', text: JSON.stringify({ success: true }) }] };
  }
);

// ── Screenplay ──
server.tool(
  'list_screenplay',
  'List screenplay elements for a project (ordered by sort_order)',
  { project_id: z.string() },
  async ({ project_id }) => {
    const { data, error } = await supabase.from('screenplay_elements').select('*').eq('project_id', project_id).order('sort_order');
    if (error) throw new Error(error.message);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  'save_screenplay',
  'Replace all screenplay elements for a project',
  {
    user_id: z.string(),
    project_id: z.string(),
    elements: z.array(z.object({
      type: z.string(),
      text: z.string(),
    })),
  },
  async ({ user_id, project_id, elements }) => {
    await supabase.from('screenplay_elements').delete().eq('project_id', project_id);
    if (!elements || elements.length === 0) {
      return { content: [{ type: 'text', text: '[]' }] };
    }
    const inserts = elements.map((el, i) => ({
      user_id,
      project_id,
      sort_order: i,
      element_type: el.type,
      text: el.text,
    }));
    const { data, error } = await supabase.from('screenplay_elements').insert(inserts).select();
    if (error) throw new Error(error.message);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// ── Mind Map ──
server.tool(
  'list_mindmap',
  'List mind map nodes and links for a project',
  { project_id: z.string() },
  async ({ project_id }) => {
    const [nodes, links] = await Promise.all([
      supabase.from('mind_map_nodes').select('*').eq('project_id', project_id),
      supabase.from('mind_map_links').select('*').eq('project_id', project_id),
    ]);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ nodes: nodes.data || [], links: links.data || [] }, null, 2),
      }],
    };
  }
);

// ── Recordings ──
server.tool(
  'list_recordings',
  'List recordings for a project (newest first)',
  { project_id: z.string() },
  async ({ project_id }) => {
    const { data, error } = await supabase.from('recordings').select('*').eq('project_id', project_id).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// ── Media Uploads ──
server.tool(
  'list_media',
  'List media uploads for a project (newest first)',
  { project_id: z.string() },
  async ({ project_id }) => {
    const { data, error } = await supabase.from('media_uploads').select('*').eq('project_id', project_id).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// ── SQL Query (admin via Management API) ──
function getProjectRef() {
  const match = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) throw new Error('Cannot extract project ref from SUPABASE_URL');
  return match[1];
}

server.tool(
  'run_query',
  'Run a raw SQL query via Supabase Management API (admin only)',
  { query: z.string() },
  async ({ query }) => {
    const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('SUPABASE_ACCESS_TOKEN not set. Create one at https://supabase.com/dashboard/account/tokens');
    }
    const projectRef = getProjectRef();
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Management API error (${response.status}): ${text.substring(0, 500)}`);
    }
    const data = await response.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// ── Start server over stdio ──
const transport = new StdioServerTransport();
await server.connect(transport);