import { openDB, type IDBPDatabase } from 'idb';
import type { ScheduledTask } from './types';
import { logger } from '../lib/logger';

const log = logger.module('taskstore');

export class TaskStore {
  private db: IDBPDatabase | null = null;
  private fallback: Map<string, ScheduledTask> | null = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      this.db = await openDB('jetbot-scheduler', 1, {
        upgrade(db) {
          db.createObjectStore('tasks', { keyPath: 'id' });
        },
      });
    } catch {
      log.warn('IndexedDB unavailable, using in-memory fallback');
      this.fallback = new Map();
    }
    this.initialized = true;
  }

  async addTask(task: ScheduledTask): Promise<void> {
    await this.init();
    if (this.db) {
      await this.db.put('tasks', task);
    } else {
      this.fallback!.set(task.id, task);
    }
  }

  async updateTask(id: string, partial: Partial<ScheduledTask>): Promise<void> {
    await this.init();
    const existing = await this.getTask(id);
    if (!existing) return;
    const updated = { ...existing, ...partial };
    if (this.db) {
      await this.db.put('tasks', updated);
    } else {
      this.fallback!.set(id, updated);
    }
  }

  async removeTask(id: string): Promise<void> {
    await this.init();
    if (this.db) {
      await this.db.delete('tasks', id);
    } else {
      this.fallback!.delete(id);
    }
  }

  async getTask(id: string): Promise<ScheduledTask | undefined> {
    await this.init();
    if (this.db) {
      return this.db.get('tasks', id);
    }
    return this.fallback!.get(id);
  }

  async getAllTasks(): Promise<ScheduledTask[]> {
    await this.init();
    if (this.db) {
      return this.db.getAll('tasks');
    }
    return [...this.fallback!.values()];
  }

  async getActiveTasks(): Promise<ScheduledTask[]> {
    const all = await this.getAllTasks();
    return all.filter(t => t.status === 'active');
  }
}
