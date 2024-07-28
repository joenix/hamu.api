const Koa = require('koa');
const cors = require('@koa/cors');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const crypto = require('crypto');
const axios = require('axios');
const WechatAPI = require('wechat-api');

const app = new Koa();
const router = new Router();

const APPID = `wx04fa36ea3e78fe63`;
const APPSECRET = `d05e9cd46d499b01f1c9ed0599ee204f`;
const REDIRECT_URI = `http://127.0.0.1:7086/callback`;

const api = new WechatAPI(APPID, APPSECRET);
console.log(1, api);

// 解决跨域问题
app.use(
  cors({
    origin: '*', // 允许所有域名进行访问
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 允许的请求方法
    allowHeaders: ['Content-Type', 'Authorization'] // 允许的请求头
  })
);

// 微信验证接口
router.get('/', async (ctx) => {
  const { signature, timestamp, nonce, echostr } = ctx.query;
  const token = `hamuai`;

  const elements = [token, timestamp, nonce].sort();
  const tempStr = elements.join('');
  const hash = crypto.createHash('sha1').update(tempStr).digest('hex');

  ctx.body = hash === signature ? echostr : 'Invalid signature';
});

// 获取 Access Token
router.get('/get-access-token', async (ctx) => {
  // 服务号代码，但不明原因不可用
  // const { data } = await axios.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${APPSECRET}`);
  // ctx.body = data;

  // 小程序版 Access Token
  const { data } = await axios.post(`https://api.weixin.qq.com/cgi-bin/stable_token`, { grant_type: `client_credential`, appid: APPID, secret: APPSECRET, force_refresh: false });
  ctx.body = data;
});

// 获取带参二维码
router.get('/get-qrcode', async (ctx) => {
  const { access_token } = ctx.query;
  const { data } = await axios.post(`https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${access_token}`, { expire_seconds: 86400, action_name: 'QR_SCENE', action_info: { scene: { scene_id: `hamuai` } } });
  ctx.body = data;
});

// 授权重定向接口
router.get('/qr', async (ctx) => {
  const redirectUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${APPID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`;
  ctx.redirect(redirectUrl);
});

// 获取 Access Token

// 回调路由
router.get('/callback', async (ctx) => {
  const { code } = ctx.query;

  console.log('code:', code);

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

    console.log('userInfo:', userInfo);

    // 响应
    ctx.body = userInfo;
    // ctx.body = `
    //   <h1>Login Successful</h1>
    //   <p>OpenID: ${userInfo.openid}</p>
    //   <p>Nickname: ${userInfo.nickname}</p>
    //   <img src="${userInfo.headimgurl}" alt="Avatar">
    // `;
  } catch (error) {
    console.error(error);
    ctx.body = 'Error during login';
  }
});

app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());

app.listen(7086, () => {
  console.log('Server is running on http://localhost:7086');
});
