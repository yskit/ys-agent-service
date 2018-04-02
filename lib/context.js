const delegate = require('delegates');
const proto = {};
module.exports = proto;

delegate(proto, 'request')
  .getter('url')
  .access('data');

delegate(proto, 'response')
  .getter('from')
  .get('cid');