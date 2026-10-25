# 发布到 Cloudflare Pages

当前在线地址：[dear-quiet-typewriter.pages.dev](https://dear-quiet-typewriter.pages.dev/)。当前使用直接上传构建产物的方式发布；GitHub 仓库用于管理源码，暂未与 Cloudflare 自动部署关联。

## 构建

使用 Node.js 22.12 或以上版本，推荐 Node.js 24。

```sh
npm ci
npm test
npm run build:cloudflare
```

构建输出为 `dist-cloudflare/`。只发布此目录；源码、开发验收页面、依赖目录、凭据和浏览器内保存的作品均不属于部署产物。

## 更新现有站点

使用有权管理该 Cloudflare 项目的账号登录，再上传构建结果：

```sh
npx wrangler login
npx wrangler pages deploy dist-cloudflare --project-name dear-quiet-typewriter --branch main
node scripts/check-cloudflare.mjs https://dear-quiet-typewriter.pages.dev/
```

已有项目不需要重新创建。其他使用者应先在自己的 Cloudflare 账号创建 Pages 项目，并将上述项目名换为自己的名称。公开站点检查脚本仅用于本项目固定地址。

不要将 Cloudflare 或 GitHub 凭据写入源码或提交到仓库。GitHub 的检查流程只运行测试与构建，不包含部署密钥。

## 离线与更新

Cloudflare 构建会生成内容版本化的 Service Worker、资源清单、图标和路由回退。首次在线打开并显示“可离线使用 / Ready offline”后，静态资源才完成离线准备，首次约需 14 MB 下载。作品和照片保存在浏览器的 IndexedDB 中。

更新安装到独立缓存，页面提示“保存并刷新 / Save and refresh”。用户确认后先保存，再启用新版本。浏览器清理数据仍可能移除作品，重要内容请另外导出备份。

不同域名的浏览器存储彼此独立。迁移站点时，在旧站的收纳中选择作品并备份，再到新站导入 JSON 文件。

`pages.dev` 的访问情况会因地区和网络变化，不能保证中国大陆所有网络始终可达。手机和平板布局仍有待后续完善。
