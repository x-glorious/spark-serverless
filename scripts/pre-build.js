import { $ } from 'execa'

if(process.env.VERCEL) {
  (async () => {
    await $`npm run pre:build`
  })()
}

