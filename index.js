const compose = require('koa-compose');
const context = require('./lib/context');
const request = require('./lib/request');
const response = require('./lib/response');
const { EventEmitter } = require('events');
const hasOwnProperty = Object.prototype.hasOwnProperty;

module.exports = class AgentService extends EventEmitter {
  constructor(agent) {
    super();
    this.agent = agent;
    this.middleware = [];
    this.env = process.env.NODE_ENV || 'development';
    this.context = Object.create(context);
    this.request = Object.create(request);
    this.response = Object.create(response);
  }

  use(fn) {
    if (typeof fn !== 'function') throw new TypeError('middleware must be a function!');
    this.middleware.push(fn);
    return this;
  }

  close() {
    this.status = false;
  }

  callback() {
    const fn = compose(this.middleware);

    if (!this.listeners('error').length) {
      this.on('error', this.onerror.bind(this));
    }

    const handleRequest = (req, res) => {
      if (!this.status) return;
      const ctx = this.createContext(req, res);
      return this.handleRequest(ctx, fn);
    };

    this.status = true;

    return handleRequest;
  }

  handleRequest(ctx, fnMiddleware) {
    const onerror = err => this.onerror(err, ctx);
    const handleResponse = () => {
      if (ctx.to) {
        if (ctx.body !== undefined) {
          return ctx.response.send(ctx.to, ctx.body);
        } else {
          return ctx.response.send(ctx.to, {
            error: '404 Not found'
          });
        }
      }
      if (ctx.body !== undefined) {
        return ctx.response.reply(ctx.body);
      } else {
        return ctx.response.reply({
          error: '404 Not found'
        });
      }
    };
    return fnMiddleware(ctx).then(handleResponse).catch(onerror);
  }

  createContext(req, res) {
    const context = Object.create(this.context);
    const request = context.request = Object.create(this.request);
    const response = context.response = Object.create(this.response);
    context.app = request.app = response.app = this;
    context.req = request.req = response.req = req;
    context.res = request.res = response.res = res;
    request.ctx = response.ctx = context;
    request.response = response;
    response.request = request;
    context.agent = request.agent = response.agent = this.agent;
    return context;
  }

  onerror(err, ctx) {
    const msg = err.stack || err.toString();

    if (this.env !== 'production' && this.env !== 'product') {
      console.error();
      console.error(msg.replace(/^/gm, '  '));
      console.error();
    }

    if (ctx) {
      if (ctx.to) {
        return ctx.response.send(ctx.to, {
          status: 500,
          message: msg
        });
      }
  
      ctx.response.reply({
        status: 500,
        message: msg
      });
    }
  }
}