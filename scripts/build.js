import { $ } from 'execa'
import Path from 'path'

(async () => {
  await $({
    cwd: Path.join(process.cwd(), '../')
  })`npm run before:build`
})()
