import * as loggerModule from '@kafka/logger';

const WinstonLogger = (loggerModule as any).WinstonLogger;

describe('WinstonLogger', () => {
  it('WinstonLogger class should implement LoggerService methods', () => {
    expect(WinstonLogger).toBeDefined();
    const l = new WinstonLogger();
    expect(typeof l.log).toBe('function');
    expect(typeof l.error).toBe('function');
    expect(typeof l.warn).toBe('function');
    // call methods to ensure they don't throw
    l.log('test log');
    l.warn('test warn');
    l.error('test error');
  });
});
