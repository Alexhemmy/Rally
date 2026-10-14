type Level = 'info' | 'warn' | 'error';

export function log(level: Level, msg: string, meta?: Record<string, unknown>) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    msg,
    ...meta,
  });
  if (level === 'error') console.error(line);
  else console.log(line);
}
