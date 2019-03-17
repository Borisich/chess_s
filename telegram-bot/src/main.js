const Koa = require('koa');
const KoaRouter = require('koa-router');

const app = new Koa();
const router = new KoaRouter();

const port = 44444;

const secretRouterKey = 'secret'; // TODO: get from env variable

router.post(`/${secretRouterKey}`, (ctx, next) => {
    console.log('received message from tg bot:', ctx.body);
});

app.use(router.routes()).use(router.allowedMethods());

console.info('Server started on', port);

app.listen(port);
