declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
    NODE_ENV?: 'development' | 'production' | 'test';
    VERCEL?: string;
    ADMIN_PASSWORD?: string;
    GITHUB_TOKEN?: string;
    GITHUB_REPO?: string;
    GITHUB_BRANCH?: string;
    LEAD_WEBHOOK_URL?: string;
  }
  interface Process {
    env: ProcessEnv;
    cwd(): string;
  }
}

declare const process: NodeJS.Process;

interface Buffer {
  toString(encoding?: string): string;
}

interface BufferConstructor {
  from(value: string, encoding?: string): Buffer;
  from(value: Uint8Array): Buffer;
  concat(list: readonly Uint8Array[], totalLength?: number): Buffer;
}

declare const Buffer: BufferConstructor;

declare module 'node:crypto' {
  export interface Hash {
    update(data: string | Uint8Array): Hash;
    digest(encoding: 'hex'): string;
    digest(): Uint8Array;
  }
  export function createHash(algorithm: string): Hash;
  export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean;
  export function randomBytes(size: number): { toString(encoding: string): string };
}

declare module 'node:fs' {
  export function readFileSync(path: string, encoding: string): string;
  export namespace promises {
    export function readFile(path: string, encoding: string): Promise<string>;
    export function writeFile(path: string, data: string, encoding: string): Promise<void>;
    export function rename(oldPath: string, newPath: string): Promise<void>;
    export function unlink(path: string): Promise<void>;
  }
}

declare module 'node:path' {
  export function resolve(...paths: string[]): string;
}

declare module 'node:assert/strict' {
  export function doesNotThrow(block: () => void, message?: string | Error): void;
  export function throws(block: () => void, error?: unknown, message?: string): void;
  export function rejects(asyncFn: () => Promise<unknown>, error?: unknown, message?: string): Promise<void>;
  export function equal(actual: unknown, expected: unknown, message?: string | Error): void;
  const assert: {
    doesNotThrow: typeof doesNotThrow;
    throws: typeof throws;
    rejects: typeof rejects;
    equal: typeof equal;
  };
  export default assert;
}

declare module 'node:test' {
  export type TestFn = () => void | Promise<void>;
  export default function test(name: string, fn: TestFn): void;
}
