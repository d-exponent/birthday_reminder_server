const Email = require('../../features/email')

exports.GET = async request => {
  // try {
  //   await new Email('Desmond Odion', 'desmondodion24@gmail.com').sendAccessCode(
  //     'DESMOND'
  //   )
  // } catch (e) {
  //   console.error('error')
  // }

  return new Response('Hello from vercel cron')
}
