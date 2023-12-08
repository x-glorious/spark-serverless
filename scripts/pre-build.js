import { $ } from 'execa'

if(process.env.VERCEL) {
  (async () => {
    await $`npm run pre:build`

    const {stdout}  = await $`ls api`
    console.log(stdout)
  })()
}

