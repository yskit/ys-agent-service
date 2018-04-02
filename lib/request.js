module.exports = {
  get url() {
    return this.req.url;
  },
  get data() {
    return this.req.data;
  }
}