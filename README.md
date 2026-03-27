# wx-mini-program-publisher

一个可通过 `npx` 直接调用的微信小程序自动发布脚本，适合在 CI/CD 流水线中使用。

## 通过 npx 调用

```bash
npx wx-mini-program-publisher
# 或
npx wx-mini-publish
```

也可以带参数：

```bash
npx wx-mini-program-publisher \
  --project-path ./miniprogram \
  --desc "ci auto release" \
  --robot 1
```

发布版本号固定读取流水线环境变量：`CI_BUILD_NUMBER`。

## 环境变量

### 必填

- `WX_APPID`（或 `APPID`）
- `CI_BUILD_NUMBER`：流水线构建号，作为发布版本号
- 私钥（二选一）
  - `WX_PRIVATE_KEY_BASE64`（或 `PRIVATE_KEY_BASE64`）：推荐，放 base64 编码后的私钥内容
  - `WX_PRIVATE_KEY`（或 `PRIVATE_KEY`）：明文私钥，支持 `\n` 自动转真实换行

> 脚本会在运行时把私钥写入临时文件，并将该临时文件路径传给 `miniprogram-ci` 的 `privateKeyPath`，发布结束后自动删除。

### 可选

- `WX_PROJECT_PATH`：小程序项目目录，默认当前目录
- `WX_DESC`：版本描述
- `WX_ROBOT`：机器人编号（1-30）
- `WX_CI_SETTING_JSON`：自定义 `miniprogram-ci upload.setting` JSON 字符串

## CI 使用示例（GitHub Actions）

```yaml
- name: Publish mini program
  env:
    WX_APPID: ${{ secrets.WX_APPID }}
    WX_PRIVATE_KEY_BASE64: ${{ secrets.WX_PRIVATE_KEY_BASE64 }}
    CI_BUILD_NUMBER: ${{ github.run_number }}
    WX_DESC: ${{ github.event.head_commit.message }}
  run: npx wx-mini-program-publisher --project-path ./miniprogram --robot 1
```
