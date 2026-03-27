# wx-mini-program-publisher

一个可通过 `npx` 直接调用的微信小程序自动发布脚本，适合在 CI/CD 流水线中使用。

## 通过 npx 调用

```bash
npx -y wx-mini-program-publisher@0.1.0
```

也可以带参数：

```bash
npx -y wx-mini-program-publisher@0.1.0 \
  --project-path ./miniprogram \
  --desc "ci auto release" \
  --robot 1
```

> 建议在 CI 中始终使用 `-y`（跳过交互确认）并固定版本号（如 `@0.1.0`）以保证发布流程稳定可复现。

发布版本号读取规则：
- 默认读取环境变量 `BUILD_NUMBER`
- 可通过参数 `--build-number-env <name>` 或环境变量 `WX_BUILD_NUMBER_ENV` 指定“读取哪个环境变量作为版本号”

## 环境变量

### 必填

- `WX_APPID`（或 `APPID`）
- `BUILD_NUMBER`：流水线构建号，默认作为发布版本号
- 私钥（二选一）
  - `WX_PRIVATE_KEY_BASE64`（或 `PRIVATE_KEY_BASE64`）：推荐，放 base64 编码后的私钥内容
  - `WX_PRIVATE_KEY`（或 `PRIVATE_KEY`）：明文私钥，支持 `\n` 自动转真实换行

> 脚本会在运行时把私钥写入临时文件，并将该临时文件路径传给 `miniprogram-ci` 的 `privateKeyPath`，发布结束后自动删除。

### 可选

- `WX_PROJECT_PATH`：小程序项目目录，默认当前目录
- `WX_BUILD_NUMBER_ENV`：版本号来源环境变量名（默认 `BUILD_NUMBER`）
- `WX_DESC`：版本描述
- `WX_ROBOT`：机器人编号（1-30）
- `WX_CI_SETTING_JSON`：自定义 `miniprogram-ci upload.setting` JSON 字符串

## CI 使用示例（GitHub Actions）

```yaml
- name: Publish mini program
  env:
    WX_APPID: ${{ secrets.WX_APPID }}
    WX_PRIVATE_KEY_BASE64: ${{ secrets.WX_PRIVATE_KEY_BASE64 }}
    BUILD_NUMBER: ${{ github.run_number }}
    WX_DESC: ${{ github.event.head_commit.message }}
  run: npx -y wx-mini-program-publisher@0.1.0 --project-path ./miniprogram --robot 1
```

如果你的流水线编号变量名不是 `BUILD_NUMBER`，可以这样指定：

```bash
npx -y wx-mini-program-publisher@0.1.0 --build-number-env CI_BUILD_NUMBER
```
