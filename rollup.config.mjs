import typescript from 'rollup-plugin-typescript2'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import Path from 'node:path'
import Fs from 'node:fs'
import Fg from 'fast-glob'
import { fileURLToPath } from 'node:url';

const { devDependencies = {}, dependencies = {} } = JSON.parse(Fs.readFileSync(Path.join(process.cwd(), 'package.json')).toString())

export default {
  input: Object.fromEntries( Fg.sync('./src/**/*.ts', {
      ignore: './src/.global/**/*'
      }
    ).map(file => [
      // This remove `src/` as well as the file extension from each
      // file, so e.g. src/nested/foo.js becomes nested/foo
      Path.relative(
        'src',
        file.slice(0, file.length - Path.extname(file).length)
      ),
      // This expands the relative paths to absolute paths, so e.g.
      // src/nested/foo becomes /project/src/nested/foo.js
      fileURLToPath(new URL(file, import.meta.url))
    ])
  ),
  external: [...Object.keys(devDependencies), ...Object.keys(dependencies)],
  output: [
    {
      dir: 'api',
      format: 'es',
      strict: false
    },
  ],
  plugins: [
    commonjs(),
    nodeResolve(),
    typescript({
      useTsconfigDeclarationDir: true,
    })
  ],
}
