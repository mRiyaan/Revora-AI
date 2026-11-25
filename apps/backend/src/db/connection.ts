import fs from 'node:fs';
import path from 'node:path';
import { CONFIG } from '../config';

type SqlParam = string | number | bigint | Uint8Array | null;

function sanitizeParams(params: unknown[]): SqlParam[] {
  return params.map((p) => (p === undefined ? null : (p as SqlParam)));
}

export interface PreparedStatement {
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
  run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
}

export interface SqliteDbWrapper {
  exec(sql: string): void;
  pragma(stmt: string): void;
  prepare(sql: string): PreparedStatement;
  transaction<T>(fn: () => T): (() => T) & { immediate: () => T };
  close(): void;
}

let dbInstance: SqliteDbWrapper | null = null;

export function getDb(): SqliteDbWrapper {
  if (!dbInstance) {
    fs.mkdirSync(path.dirname(CONFIG.sqlitePath), { recursive: true });
    let raw: {
      exec(sql: string): void;
      prepare(sql: string): {
        get(...args: SqlParam[]): unknown;
        all(...args: SqlParam[]): unknown[];
        run(...args: SqlParam[]): { changes: number | bigint; lastInsertRowid: number | bigint };
      };
      close(): void;
    };

    try {
      // Node 20 (outside sandbox) natively loads better-sqlite3 prebuilt ABI 115
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const BetterSqlite3 = require('better-sqlite3') as new (file: string) => typeof raw;
      raw = new BetterSqlite3(CONFIG.sqlitePath);
    } catch {
      // Node 22+ (sandbox) falls back to built-in node:sqlite
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { DatabaseSync } = require('node:sqlite') as {
        DatabaseSync: new (file: string) => typeof raw;
      };
      raw = new DatabaseSync(CONFIG.sqlitePath);
    }

    raw.exec('PRAGMA journal_mode = WAL;');
    raw.exec('PRAGMA busy_timeout = 5000;');
    raw.exec('PRAGMA foreign_keys = ON;');

    const wrapper: SqliteDbWrapper = {
      exec(sql: string) {
        raw.exec(sql);
      },
      pragma(stmt: string) {
        raw.exec(`PRAGMA ${stmt};`);
      },
      prepare(sql: string): PreparedStatement {
        const stmt = raw.prepare(sql);
        return {
          get(...params: unknown[]) {
            return stmt.get(...sanitizeParams(params));
          },
          all(...params: unknown[]) {
            return stmt.all(...sanitizeParams(params));
          },
          run(...params: unknown[]) {
            const res = stmt.run(...sanitizeParams(params));
            return {
              changes: Number(res.changes),
              lastInsertRowid: res.lastInsertRowid,
            };
          },
        };
      },
      transaction<T>(fn: () => T) {
        const runTx = (beginSql: string): T => {
          raw.exec(beginSql);
          try {
            const result = fn();
            raw.exec('COMMIT;');
            return result;
          } catch (err) {
            try {
              raw.exec('ROLLBACK;');
            } catch {
              // ignore rollback error
            }
            throw err;
          }
        };
        const txFn = () => runTx('BEGIN;');
        txFn.immediate = () => runTx('BEGIN IMMEDIATE;');
        return txFn;
      },
      close() {
        raw.close();
      },
    };

    dbInstance = wrapper;
  }
  return dbInstance;
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
