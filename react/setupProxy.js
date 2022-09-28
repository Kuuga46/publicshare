/*
 * @Author: lxd
 * @Date: 2021-08-30 16:58:20
 * @LastEditTime: 2022-09-28 11:38:26
 * @LastEditors: lxd
 * @Description:前端使用代理解决调试时跨域问题
 */
// 导入proxy lxd
const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function (app) {
  if (process.env.NODE_ENV === 'development') {
    app.use(
      // lxd 需要拦截的 api开始，注意取的是端口号后的部分
      '/api',
      createProxyMiddleware({
        target: 'http://192.168.200.120:9699',
        changeOrigin: true,
        // lxd 重写路径，将/api前面的部分去掉，注意是重写target的路径
        // pathRewrite: {
        //   '^/api': '',
        // },
      })
    );
  }
};
