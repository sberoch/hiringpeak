import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Multer type regression (issue #13)', () => {
  it('tsconfig includes multer in the types array so Express.Multer.File resolves', () => {
    const tsconfig = JSON.parse(
      readFileSync(resolve(__dirname, '../../tsconfig.json'), 'utf-8'),
    );
    expect(tsconfig.compilerOptions.types).toContain('multer');
  });

  it('candidate.controller.ts uses Express.Multer.File without import error', () => {
    const controller = readFileSync(
      resolve(__dirname, 'candidate.controller.ts'),
      'utf-8',
    );
    expect(controller).toMatch(/Express\.Multer\.File/);
  });
});
