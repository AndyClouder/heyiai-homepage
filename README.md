# heyiai-homepage

合一（Andy）个人主页，部署为 Cloudflare Worker `ai`。

线上：https://ai.heyiai.workers.dev

## 目录结构

- `public/` — 静态资源（`index.html`、样式、脚本、图片）
- `wrangler.jsonc` — Worker 配置（名称 `ai`、assets 指向 `public/`）

## Git 工程实践

**唯一正式仓库**：`AndyClouder/heyiai-homepage`。

- 功能改动用 `git worktree` 隔离，主工作区尽量留在 `main`。
- **禁止**改仓库名；**禁止**在推送失败时新建临时仓 / 旁路仓。
- 推送或 refs 异常时：**停手**，把错误原文贴出来，等修好再推。不要改名、不要开旁路仓绕过去。

### worktree 示例

```bash
# 在主工作区（保持 main）
git fetch origin
git checkout main
git pull --ff-only origin main

# 新开功能分支的独立目录
git worktree add ../heyiai-homepage-feat-xxx -b feat/xxx origin/main

# 在 ../heyiai-homepage-feat-xxx 里改代码、提交、推送、开 PR
# 合并并清理后：
git worktree remove ../heyiai-homepage-feat-xxx
git branch -d feat/xxx   # 若本地分支还在
```

## 发布流程

1. 从 `main` 拉 worktree / 分支改动
2. 推送并开 PR
3. 预览（本机）：

   ```bash
   WRANGLER_CACHE_DIR=/tmp/wcache npx wrangler versions upload
   ```

   把预览 URL 贴到 PR / 对话里，等 Andy 确认。

4. Andy 确认后：合并 PR
5. 生产发布：

   ```bash
   WRANGLER_CACHE_DIR=/tmp/wcache npx wrangler deploy
   ```

注意：

- **不要**给 Wrangler 设 `XDG_CONFIG_HOME`（会搞乱本机登录态路径）。
- 生产只从已合并的 `main` 发布，不要从脏分支直接 `deploy`。

## GitHub Actions（可选，需 Secrets）

仓库里已放预览 / 部署 workflow。在仓库 **Settings → Secrets and variables → Actions** 添加：

| Secret | 说明 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token（需 Workers 编辑权限） |
| `CLOUDFLARE_ACCOUNT_ID` | 账号 ID，当前为 `c2f58d9aef3c220cb9a3aab67bc4abb2` |

未配置这两个 Secret 时，workflow 会跳过 Wrangler 并留下说明，不会硬失败挡 PR。配好后：

- `pull_request` → `.github/workflows/preview.yml`：`wrangler versions upload`，并尝试把预览 URL 评论到 PR
- `push` 到 `main` → `.github/workflows/deploy.yml`：`wrangler deploy`

Secrets 未就绪前，继续用上面的本机 Wrangler 命令做预览与发布即可。
