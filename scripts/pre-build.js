import { $ } from 'execa'

console.error('0-------')
console.error(process.env)

(async () => {
  await $`npm run pre:build`
})()
