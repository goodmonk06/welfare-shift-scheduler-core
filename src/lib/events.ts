/**
 * Domain events system
 *
 * Type-safe event publishing and subscription
 */

import { logger } from './logger';

/**
 * Base domain event interface
 */
export interface DomainEvent {
  type: string;
  timestamp: Date;
  aggregateId: string;
  version: number;
  data: any;
  metadata?: {
    correlationId?: string;
    causationId?: string;
    userId?: string;
    [key: string]: any;
  };
}

/**
 * Specific event types
 */

export interface EmployeeCreatedEvent extends DomainEvent {
  type: 'EMPLOYEE_CREATED';
  data: {
    employeeId: string;
    facilityId?: string;
    name: string;
    role: string;
  };
}

export interface ScheduleGeneratedEvent extends DomainEvent {
  type: 'SCHEDULE_GENERATED';
  data: {
    scheduleId: string;
    facilityId?: string;
    yearMonth: string;
    employeeCount: number;
    feasible: boolean;
    score: number;
  };
}

export interface ShiftSwapRequestedEvent extends DomainEvent {
  type: 'SHIFT_SWAP_REQUESTED';
  data: {
    requestId: string;
    facilityId: string;
    requesterId: string;
    targetEmployeeId: string;
    date: string;
  };
}

export interface ShiftSwapApprovedEvent extends DomainEvent {
  type: 'SHIFT_SWAP_APPROVED';
  data: {
    requestId: string;
    facilityId: string;
    approverId: string;
  };
}

export interface ScheduleModifiedEvent extends DomainEvent {
  type: 'SCHEDULE_MODIFIED';
  data: {
    scheduleId: string;
    facilityId?: string;
    changeCount: number;
    modifiedBy: string;
  };
}

export interface FacilityCreatedEvent extends DomainEvent {
  type: 'FACILITY_CREATED';
  data: {
    facilityId: string;
    name: string;
    type: string;
  };
}

/**
 * Union type of all events
 */
export type AnyDomainEvent =
  | EmployeeCreatedEvent
  | ScheduleGeneratedEvent
  | ShiftSwapRequestedEvent
  | ShiftSwapApprovedEvent
  | ScheduleModifiedEvent
  | FacilityCreatedEvent;

/**
 * Event handler type
 */
export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => void | Promise<void>;

/**
 * Event bus for publishing and subscribing to domain events
 */
class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private globalHandlers: Set<EventHandler> = new Set();

  /**
   * Subscribe to a specific event type
   */
  on<T extends DomainEvent>(eventType: T['type'], handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as EventHandler);

    logger.debug('Event handler registered', { eventType, handlerCount: this.handlers.get(eventType)!.size });
  }

  /**
   * Subscribe to all events
   */
  onAny(handler: EventHandler): void {
    this.globalHandlers.add(handler);
    logger.debug('Global event handler registered');
  }

  /**
   * Unsubscribe from an event type
   */
  off<T extends DomainEvent>(eventType: T['type'], handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    }
  }

  /**
   * Unsubscribe from all events
   */
  offAny(handler: EventHandler): void {
    this.globalHandlers.delete(handler);
  }

  /**
   * Publish an event
   */
  async publish<T extends DomainEvent>(event: T): Promise<void> {
    logger.debug('Publishing event', {
      type: event.type,
      aggregateId: event.aggregateId
    });

    const specificHandlers = this.handlers.get(event.type) || new Set();
    const allHandlers = [...specificHandlers, ...this.globalHandlers];

    const promises = allHandlers.map(async handler => {
      try {
        await handler(event);
      } catch (error) {
        logger.error(`Error in event handler for ${event.type}`, error as Error, {
          eventType: event.type,
          aggregateId: event.aggregateId,
        });
      }
    });

    await Promise.all(promises);
  }

  /**
   * Publish multiple events
   */
  async publishAll(events: DomainEvent[]): Promise<void> {
    await Promise.all(events.map(event => this.publish(event)));
  }

  /**
   * Clear all handlers (mainly for testing)
   */
  clear(): void {
    this.handlers.clear();
    this.globalHandlers.clear();
    logger.debug('Event bus cleared');
  }

  /**
   * Get count of registered handlers
   */
  getHandlerCount(eventType?: string): number {
    if (eventType) {
      return (this.handlers.get(eventType)?.size || 0) + this.globalHandlers.size;
    }

    let total = this.globalHandlers.size;
    this.handlers.forEach(handlers => {
      total += handlers.size;
    });
    return total;
  }
}

/**
 * Event factory helpers
 */
export class EventFactory {
  private static version = 1;

  static createEmployeeCreatedEvent(
    employeeId: string,
    name: string,
    role: string,
    facilityId?: string,
    metadata?: DomainEvent['metadata']
  ): EmployeeCreatedEvent {
    return {
      type: 'EMPLOYEE_CREATED',
      timestamp: new Date(),
      aggregateId: employeeId,
      version: this.version,
      data: { employeeId, facilityId, name, role },
      metadata,
    };
  }

  static createScheduleGeneratedEvent(
    scheduleId: string,
    yearMonth: string,
    employeeCount: number,
    feasible: boolean,
    score: number,
    facilityId?: string,
    metadata?: DomainEvent['metadata']
  ): ScheduleGeneratedEvent {
    return {
      type: 'SCHEDULE_GENERATED',
      timestamp: new Date(),
      aggregateId: scheduleId,
      version: this.version,
      data: { scheduleId, facilityId, yearMonth, employeeCount, feasible, score },
      metadata,
    };
  }

  static createShiftSwapRequestedEvent(
    requestId: string,
    facilityId: string,
    requesterId: string,
    targetEmployeeId: string,
    date: string,
    metadata?: DomainEvent['metadata']
  ): ShiftSwapRequestedEvent {
    return {
      type: 'SHIFT_SWAP_REQUESTED',
      timestamp: new Date(),
      aggregateId: requestId,
      version: this.version,
      data: { requestId, facilityId, requesterId, targetEmployeeId, date },
      metadata,
    };
  }

  static createFacilityCreatedEvent(
    facilityId: string,
    name: string,
    type: string,
    metadata?: DomainEvent['metadata']
  ): FacilityCreatedEvent {
    return {
      type: 'FACILITY_CREATED',
      timestamp: new Date(),
      aggregateId: facilityId,
      version: this.version,
      data: { facilityId, name, type },
      metadata,
    };
  }
}

// Singleton event bus
export const eventBus = new EventBus();
