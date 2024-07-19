const Koa = require('koa');
const Router = require('koa-router');
const crypto = require('crypto');

const app = new Koa();
const router = new Router();

const TOKEN = `hamuai`;

// 微信接口验证
router.get('/wechat', async (ctx) => {
  const { signature, timestamp, nonce, echostr } = ctx.query;

  const token = TOKEN;
  const elements = [token, timestamp, nonce].sort();
  const tempStr = elements.join('');
  const hash = crypto.createHash('sha1').update(tempStr).digest('hex');

  if (hash === signature) {
    ctx.body = echostr;
  } else {
    ctx.body = 'Invalid signature';
  }
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(5000, () => {
  console.log('Server is running on http://localhost:5000');
});
