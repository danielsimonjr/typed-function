import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const banner = `/**
 * typed-function v5.0.0
 * https://github.com/josdejong/typed-function
 *
 * Type checking for JavaScript functions
 *
 * @license MIT
 */`;

/** @type {import('rollup').RollupOptions[]} */
const config = [
  // ESM build
  {
    input: 'src/index.ts',
    output: {
      file: 'build/typed-function.mjs',
      format: 'es',
      sourcemap: true,
      banner,
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: true,
        declarationDir: './build',
      }),
      resolve(),
      commonjs(),
    ],
  },

  // CJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'build/typed-function.cjs',
      format: 'cjs',
      sourcemap: true,
      banner,
      exports: 'named',
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: false,
        declarationMap: false,
      }),
      resolve(),
      commonjs(),
    ],
  },

  // UMD build
  {
    input: 'src/index.ts',
    output: {
      file: 'build/typed-function.js',
      format: 'umd',
      name: 'typed',
      sourcemap: true,
      banner,
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: false,
        declarationMap: false,
      }),
      resolve(),
      commonjs(),
    ],
  },

  // Minified IIFE build
  {
    input: 'src/index.ts',
    output: {
      file: 'build/typed-function.min.js',
      format: 'iife',
      name: 'typed',
      sourcemap: true,
      banner,
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: false,
        declarationMap: false,
      }),
      resolve(),
      commonjs(),
      terser({
        format: {
          comments: /^!/,
        },
      }),
    ],
  },
];

export default config;
