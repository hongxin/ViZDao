import { openDB, type IDBPDatabase } from 'idb';
import { logger } from '../lib/logger';

const log = logger.module('vfs');

interface FileEntry {
  path: string;
  content: string;
  type: 'file' | 'directory';
  parent: string;
  createdAt: number;
  updatedAt: number;
  size: number;
}

export interface SearchResult {
  path: string;
  line: number;
  content: string;
}

export class VirtualFS {
  private db: IDBPDatabase | null = null;
  private fallback: Map<string, FileEntry> | null = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      this.db = await openDB('jetbot-fs', 1, {
        upgrade(db) {
          const store = db.createObjectStore('files', { keyPath: 'path' });
          store.createIndex('parent', 'parent');
        },
      });
    } catch {
      log.warn('IndexedDB unavailable, using in-memory fallback');
      this.fallback = new Map();
    }
    this.initialized = true;
    // Ensure /workspace exists
    if (!(await this.exists('/workspace'))) {
      await this.mkdirInternal('/workspace');
    }
  }

  async readFile(path: string): Promise<string> {
    await this.init();
    const entry = await this.get(path);
    if (!entry || entry.type !== 'file') throw new Error(`File not found: ${path}`);
    return entry.content;
  }

  async writeFile(path: string, content: string): Promise<void> {
    await this.init();
    const parent = this.parentPath(path);
    if (parent && !(await this.exists(parent))) {
      await this.mkdir(parent);
    }
    const now = Date.now();
    const existing = await this.get(path);
    const entry: FileEntry = {
      path,
      content,
      type: 'file',
      parent: parent || '/',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      size: content.length,
    };
    await this.put(entry);
  }

  async deleteFile(path: string): Promise<void> {
    await this.init();
    const entry = await this.get(path);
    if (!entry) throw new Error(`Not found: ${path}`);
    if (entry.type === 'directory') {
      const children = await this.listDir(path);
      if (children.length > 0) throw new Error(`Directory not empty: ${path}`);
    }
    await this.del(path);
  }

  async listDir(path: string): Promise<FileEntry[]> {
    await this.init();
    if (this.db) {
      return this.db.getAllFromIndex('files', 'parent', path);
    }
    return [...this.fallback!.values()].filter(e => e.parent === path);
  }

  async mkdir(path: string): Promise<void> {
    await this.init();
    const parts = path.split('/').filter(Boolean);
    let current = '';
    for (const part of parts) {
      current += '/' + part;
      if (!(await this.exists(current))) {
        await this.mkdirInternal(current);
      }
    }
  }

  async exists(path: string): Promise<boolean> {
    const entry = await this.get(path);
    return entry !== undefined;
  }

  async search(pattern: string, basePath = '/workspace'): Promise<SearchResult[]> {
    await this.init();
    const results: SearchResult[] = [];
    const regex = new RegExp(pattern, 'i');
    const allFiles = this.db
      ? await this.db.getAll('files')
      : [...this.fallback!.values()];

    for (const entry of allFiles) {
      if (entry.type !== 'file' || !entry.path.startsWith(basePath)) continue;
      const lines = entry.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i])) {
          results.push({ path: entry.path, line: i + 1, content: lines[i] });
          if (results.length >= 100) return results;
        }
      }
    }
    return results;
  }

  async stat(path: string): Promise<FileEntry | null> {
    await this.init();
    return (await this.get(path)) ?? null;
  }

  private async get(path: string): Promise<FileEntry | undefined> {
    if (this.db) return this.db.get('files', path);
    return this.fallback!.get(path);
  }

  private async put(entry: FileEntry): Promise<void> {
    if (this.db) { await this.db.put('files', entry); return; }
    this.fallback!.set(entry.path, entry);
  }

  private async del(path: string): Promise<void> {
    if (this.db) { await this.db.delete('files', path); return; }
    this.fallback!.delete(path);
  }

  private async mkdirInternal(path: string): Promise<void> {
    const parent = this.parentPath(path) || '/';
    await this.put({
      path,
      content: '',
      type: 'directory',
      parent,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      size: 0,
    });
  }

  private parentPath(path: string): string {
    const parts = path.split('/');
    parts.pop();
    return parts.join('/') || '/';
  }
}
