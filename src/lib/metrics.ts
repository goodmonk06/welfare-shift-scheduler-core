/**
 * Metrics collection and reporting
 *
 * Abstract interface for collecting application metrics
 */

export interface MetricLabels {
  [key: string]: string | number;
}

export interface CounterMetric {
  name: string;
  value: number;
  labels?: MetricLabels;
  timestamp: Date;
}

export interface GaugeMetric {
  name: string;
  value: number;
  labels?: MetricLabels;
  timestamp: Date;
}

export interface HistogramMetric {
  name: string;
  value: number;
  labels?: MetricLabels;
  timestamp: Date;
}

export interface TimingMetric {
  name: string;
  durationMs: number;
  labels?: MetricLabels;
  timestamp: Date;
}

/**
 * Metrics adapter interface
 */
export interface IMetricsAdapter {
  recordCounter(name: string, value: number, labels?: MetricLabels): void;
  recordGauge(name: string, value: number, labels?: MetricLabels): void;
  recordHistogram(name: string, value: number, labels?: MetricLabels): void;
  recordTiming(name: string, durationMs: number, labels?: MetricLabels): void;
  flush?(): Promise<void>;
}

/**
 * In-memory metrics adapter (default)
 */
class InMemoryMetricsAdapter implements IMetricsAdapter {
  private counters: CounterMetric[] = [];
  private gauges: GaugeMetric[] = [];
  private histograms: HistogramMetric[] = [];
  private timings: TimingMetric[] = [];

  private maxStoredMetrics = 1000;

  recordCounter(name: string, value: number = 1, labels?: MetricLabels): void {
    this.counters.push({ name, value, labels, timestamp: new Date() });
    this.trimMetrics(this.counters);
  }

  recordGauge(name: string, value: number, labels?: MetricLabels): void {
    this.gauges.push({ name, value, labels, timestamp: new Date() });
    this.trimMetrics(this.gauges);
  }

  recordHistogram(name: string, value: number, labels?: MetricLabels): void {
    this.histograms.push({ name, value, labels, timestamp: new Date() });
    this.trimMetrics(this.histograms);
  }

  recordTiming(name: string, durationMs: number, labels?: MetricLabels): void {
    this.timings.push({ name, durationMs, labels, timestamp: new Date() });
    this.trimMetrics(this.timings);
  }

  private trimMetrics(metrics: any[]): void {
    if (metrics.length > this.maxStoredMetrics) {
      metrics.splice(0, metrics.length - this.maxStoredMetrics);
    }
  }

  getCounters(): CounterMetric[] {
    return [...this.counters];
  }

  getGauges(): GaugeMetric[] {
    return [...this.gauges];
  }

  getHistograms(): HistogramMetric[] {
    return [...this.histograms];
  }

  getTimings(): TimingMetric[] {
    return [...this.timings];
  }

  clear(): void {
    this.counters = [];
    this.gauges = [];
    this.histograms = [];
    this.timings = [];
  }
}

/**
 * Metrics manager
 */
class MetricsManager {
  private adapter: IMetricsAdapter;

  constructor(adapter?: IMetricsAdapter) {
    this.adapter = adapter || new InMemoryMetricsAdapter();
  }

  setAdapter(adapter: IMetricsAdapter): void {
    this.adapter = adapter;
  }

  getAdapter(): IMetricsAdapter {
    return this.adapter;
  }

  /**
   * Increment a counter
   */
  increment(name: string, value: number = 1, labels?: MetricLabels): void {
    this.adapter.recordCounter(name, value, labels);
  }

  /**
   * Set a gauge value
   */
  gauge(name: string, value: number, labels?: MetricLabels): void {
    this.adapter.recordGauge(name, value, labels);
  }

  /**
   * Record a histogram value
   */
  histogram(name: string, value: number, labels?: MetricLabels): void {
    this.adapter.recordHistogram(name, value, labels);
  }

  /**
   * Record a timing (duration)
   */
  timing(name: string, durationMs: number, labels?: MetricLabels): void {
    this.adapter.recordTiming(name, durationMs, labels);
  }

  /**
   * Time a function execution
   */
  async time<T>(
    name: string,
    fn: () => Promise<T>,
    labels?: MetricLabels
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.timing(name, duration, labels);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.timing(name, duration, { ...labels, error: 'true' });
      throw error;
    }
  }

  /**
   * Time a synchronous function execution
   */
  timeSync<T>(name: string, fn: () => T, labels?: MetricLabels): T {
    const start = Date.now();
    try {
      const result = fn();
      const duration = Date.now() - start;
      this.timing(name, duration, labels);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.timing(name, duration, { ...labels, error: 'true' });
      throw error;
    }
  }

  /**
   * Flush metrics (if adapter supports it)
   */
  async flush(): Promise<void> {
    if (this.adapter.flush) {
      await this.adapter.flush();
    }
  }
}

// Singleton instance
export const metrics = new MetricsManager();

// Export for testing/advanced usage
export { InMemoryMetricsAdapter };
