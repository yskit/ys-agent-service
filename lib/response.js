module.exports = {
  get from() {
    return this.res.from;
  },
  get cid() {
    return this.res.cid;
  },
  send(...args) {
    if (args.length === 1) {
      return this.reply(args[0]);
    }
    return this.agent.send(...args);
  },

  reply(...args) {
    return this.agent.send(this.from, this.cid, ...args);
  }
}