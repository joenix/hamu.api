const Koa = require('koa');
const Router = require('koa-router');
const axios = require('axios');

const app = new Koa();
const router = new Router();

const APPID = `wx5d458ff8b11233f0`;
const APPSECRET = `d4b3ef98adbf73cf3d3faffcaab52b21`;
const REDIRECT_URI = `http://localhost:3000/api/callback`;

// 微信验证接口
router.get('/wechat', async (ctx) => {
  const { signature, timestamp, nonce, echostr } = ctx.query;
  const token = `hamuai`;

  const elements = [token, timestamp, nonce].sort();
  const tempStr = elements.join('');
  const hash = crypto.createHash('sha1').update(tempStr).digest('hex');

  ctx.body = hash === signature ? echostr : 'Invalid signature';
});

// 登录路由
router.get('/api/login', async (ctx) => {
  const redirectUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${APPID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`;
  ctx.redirect(redirectUrl);
});

// 回调路由
router.get('/api/callback', async (ctx) => {
  const { code } = ctx.query;

  if (!code) {
    ctx.body = 'Authorization failed';
    return;
  }

  try {
    // 获取 access token
    const tokenResponse = await axios.get(`https://api.weixin.qq.com/sns/oauth2/access_token?appid=${APPID}&secret=${APPSECRET}&code=${code}&grant_type=authorization_code`);
    const { access_token, openid } = tokenResponse.data;

    // 获取用户信息
    const userInfoResponse = await axios.get(`https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`);
    const userInfo = userInfoResponse.data;

    ctx.body = `
      <h1>Login Successful</h1>
      <p>OpenID: ${userInfo.openid}</p>
      <p>Nickname: ${userInfo.nickname}</p>
      <img src="${userInfo.headimgurl}" alt="Avatar">
    `;
  } catch (error) {
    console.error(error);
    ctx.body = 'Error during login';
  }
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
