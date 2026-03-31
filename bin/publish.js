#!/usr/bin/env node

const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const ci = require("miniprogram-ci");

function printHelp() {
  console.log(`
微信小程序自动发布 CLI

用法:
  npx wx-mini-program-publisher [options]
  npx wx-mini-publish [options]

可选参数:
  -p, --project-path <path>   小程序项目路径 (默认: 当前目录)
  -d, --desc <text>           版本描述 (默认: 取环境变量 WX_DESC / CI_COMMIT_MESSAGE)
  -r, --robot <number>        机器人编号 1-30 (默认: 1)
      --setting-json <json>   透传 miniprogram-ci upload.setting JSON
      --dry-run               仅打印配置，不实际发布
  -h, --help                  显示帮助

环境变量:
  # 必填 (二选一优先级: WX_APPID > APPID)
  WX_APPID / APPID

  # 私钥 (优先使用 BASE64 版本；否则读取明文并自动把 \\n 转换为换行)
  WX_PRIVATE_KEY_BASE64 / PRIVATE_KEY_BASE64
  WX_PRIVATE_KEY / PRIVATE_KEY

  # 可选
  WX_DESC
  WX_ROBOT
  WX_CI_SETTING_JSON

版本号规则:
  自动生成 YY.MMDD.xxx
  优先使用流水线内置 BUILD_NUMBER 作为 xxx，若缺失则使用当前分钟 mm
`);
}

function parseArgs(argv) {
  const args = {
    help: false,
    dryRun: false,
    projectPath: undefined,
    desc: undefined,
    robot: undefined,
    settingJson: undefined,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    switch (token) {
      case "-h":
      case "--help":
        args.help = true;
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "-p":
      case "--project-path":
        args.projectPath = argv[i + 1];
        i += 1;
        break;
      case "-d":
      case "--desc":
        args.desc = argv[i + 1];
        i += 1;
        break;
      case "-r":
      case "--robot":
        args.robot = argv[i + 1];
        i += 1;
        break;
      case "--setting-json":
        args.settingJson = argv[i + 1];
        i += 1;
        break;
      default:
        if (token.startsWith("-")) {
          throw new Error(`未知参数: ${token}`);
        }
    }
  }

  return args;
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }
  return undefined;
}

function resolveVersion() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const pad = (n) => String(n).padStart(2, "0");
  const mmdd = `${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const hhmm = `${pad(now.getHours())}${pad(now.getMinutes())}`;
  const buildNumberRaw = firstNonEmpty(process.env.BUILD_NUMBER);
  const buildNumber = buildNumberRaw
    ? buildNumberRaw.replace(/[^0-9]/g, "")
    : "";
  const patchPart = buildNumber || hhmm;

  return `${yy}.${mmdd}.${patchPart}`;
}

function readPrivateKey() {
  const keyBase64 = firstNonEmpty(
    process.env.WX_PRIVATE_KEY_BASE64,
    process.env.PRIVATE_KEY_BASE64
  );
  if (keyBase64) {
    return Buffer.from(keyBase64, "base64").toString("utf8").trim();
  }

  const keyPlain = firstNonEmpty(
    process.env.WX_PRIVATE_KEY,
    process.env.PRIVATE_KEY
  );
  if (!keyPlain) return undefined;
  return keyPlain.replace(/\\n/g, "\n").trim();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const appid = firstNonEmpty(process.env.WX_APPID, process.env.APPID);
  if (!appid) {
    throw new Error("未找到 appid，请设置 WX_APPID 或 APPID 环境变量");
  }

  const privateKey = readPrivateKey();
  if (!privateKey) {
    throw new Error(
      "未找到私钥，请设置 WX_PRIVATE_KEY / PRIVATE_KEY 或 BASE64 版本环境变量"
    );
  }

  const projectPath = path.resolve(
    firstNonEmpty(args.projectPath) || process.cwd()
  );
  const version = resolveVersion();
  const desc =
    firstNonEmpty(args.desc, process.env.WX_DESC, process.env.CI_COMMIT_MESSAGE) ||
    "auto publish by CI";

  const robotRaw = firstNonEmpty(args.robot, process.env.WX_ROBOT) || "1";
  const robot = Number.parseInt(robotRaw, 10);
  if (Number.isNaN(robot) || robot < 1 || robot > 30) {
    throw new Error("robot 必须是 1 到 30 的整数");
  }

  const settingSource = firstNonEmpty(args.settingJson, process.env.WX_CI_SETTING_JSON);
  let setting = {
    es6: true,
    minify: true,
    autoPrefixWXSS: true,
  };
  if (settingSource) {
    setting = JSON.parse(settingSource);
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "wx-mini-key-"));
  const privateKeyPath = path.join(tmpDir, "private.key");

  try {
    await fs.writeFile(privateKeyPath, privateKey, { mode: 0o600 });

    const project = new ci.Project({
      appid,
      type: "miniProgram",
      projectPath,
      privateKeyPath,
      ignores: ["node_modules/**/*"],
    });

    if (args.dryRun) {
      console.log(
        JSON.stringify(
          {
            appid,
            projectPath,
            version,
            desc,
            robot,
            setting,
            privateKeyPath,
          },
          null,
          2
        )
      );
      return;
    }

    console.log("开始上传微信小程序代码...");
    const result = await ci.upload({
      project,
      version,
      desc,
      robot,
      setting,
    });
    console.log("上传完成:");
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error("发布失败:", error?.message || error);
  process.exitCode = 1;
});
