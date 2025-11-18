/**
 * Storage adapter interface
 *
 * Abstraction for data persistence (in-memory, PostgreSQL, MongoDB, etc.)
 */

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export interface QueryResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}

/**
 * Generic storage adapter interface
 */
export interface IStorageAdapter<T> {
  /**
   * Create a new entity
   */
  create(entity: T): Promise<T>;

  /**
   * Find entity by ID
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find all entities matching criteria
   */
  findAll(criteria?: Partial<T>, options?: QueryOptions): Promise<QueryResult<T>>;

  /**
   * Update an entity
   */
  update(id: string, updates: Partial<T>): Promise<T>;

  /**
   * Delete an entity
   */
  delete(id: string): Promise<boolean>;

  /**
   * Check if entity exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count entities
   */
  count(criteria?: Partial<T>): Promise<number>;

  /**
   * Clear all data (mainly for testing)
   */
  clear?(): Promise<void>;
}

/**
 * Repository pattern base class
 */
export abstract class BaseRepository<T extends { id: string }> implements IStorageAdapter<T> {
  protected abstract adapter: IStorageAdapter<T>;

  async create(entity: T): Promise<T> {
    return this.adapter.create(entity);
  }

  async findById(id: string): Promise<T | null> {
    return this.adapter.findById(id);
  }

  async findAll(criteria?: Partial<T>, options?: QueryOptions): Promise<QueryResult<T>> {
    return this.adapter.findAll(criteria, options);
  }

  async update(id: string, updates: Partial<T>): Promise<T> {
    return this.adapter.update(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    return this.adapter.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.adapter.exists(id);
  }

  async count(criteria?: Partial<T>): Promise<number> {
    return this.adapter.count(criteria);
  }

  async clear(): Promise<void> {
    if (this.adapter.clear) {
      await this.adapter.clear();
    }
  }
}
