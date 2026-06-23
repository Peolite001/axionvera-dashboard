import { NETWORK } from './networkConfig';
import { ParsedSorobanEvent, parseSorobanEvents } from './parseEvents';

type EventCallback = (event: ParsedSorobanEvent) => void;
type StatusCallback = (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;

export class SorobanEventStream {
  private subscribers: Map<string, Set<EventCallback>> = new Map();
  private statusSubscribers: Set<StatusCallback> = new Set();
  private eventIdCache: Set<string> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnected = false;
  private isManualDisconnect = false;

  constructor(private networkConfig: typeof NETWORK) {}

  private getStatus() {
    return this.isConnected ? 'connected' : 'connecting';
  }

  private updateStatus(status: 'connecting' | 'connected' | 'disconnected' | 'error') {
    this.statusSubscribers.forEach((cb) => cb(status));
  }

  private handleReconnect() {
    if (this.isManualDisconnect) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      this.updateStatus('error');
      return;
    }
    this.reconnectAttempts++;
    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private processEvents(rawEvents: any[]) {
    const parsedEvents = parseSorobanEvents(rawEvents);
    parsedEvents.forEach((event) => {
      if (!this.eventIdCache.has(event.id)) {
        this.eventIdCache.add(event.id);
        if (this.eventIdCache.size > 1000) {
          const oldIds = Array.from(this.eventIdCache).slice(0, 500);
          oldIds.forEach((id) => this.eventIdCache.delete(id));
        }
        const callbacks = this.subscribers.get(event.contractId);
        callbacks?.forEach((cb) => cb(event));
      }
    });
  }

  connect() {
    this.isManualDisconnect = false;
    this.updateStatus('connecting');
    try {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.updateStatus('connected');
    } catch (error) {
      console.error('Failed to connect to event stream:', error);
      this.isConnected = false;
      this.updateStatus('error');
      this.handleReconnect();
    }
  }

  disconnect() {
    this.isManualDisconnect = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.isConnected = false;
    this.updateStatus('disconnected');
  }

  subscribe(contractId: string, callback: EventCallback) {
    if (!this.subscribers.has(contractId)) {
      this.subscribers.set(contractId, new Set());
    }
    this.subscribers.get(contractId)!.add(callback);
    if (!this.isConnected && !this.isManualDisconnect) {
      this.connect();
    }
    return () => this.unsubscribe(contractId, callback);
  }

  unsubscribe(contractId: string, callback: EventCallback) {
    const callbacks = this.subscribers.get(contractId);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscribers.delete(contractId);
      }
    }
    if (this.subscribers.size === 0) {
      this.disconnect();
    }
  }

  onStatusChange(callback: StatusCallback) {
    this.statusSubscribers.add(callback);
    return () => this.statusSubscribers.delete(callback);
  }

  simulateEvent(rawEvent: any) {
    this.processEvents([rawEvent]);
  }
}

let instance: SorobanEventStream | null = null;

export function getSorobanEventStream(): SorobanEventStream {
  if (!instance) {
    instance = new SorobanEventStream(NETWORK);
  }
  return instance;
}
