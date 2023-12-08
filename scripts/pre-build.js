import { $ } from 'execa'

(async () => {
  await $`npm run pre:build`
})()
