import type { Locale } from "./routing";

export type Chrome = {
  sev: Record<"error" | "warning" | "tip", { one: string; many: string; title: string }>;
  copy: string;
  copied: string;
  download: string;
  clear: string;
  fix: string;
  source: string;
  spec: string;
  line: (n: number) => string;
  noIssues: string;
  localNote: string;
  showInEditor: string;
  validator: {
    tabs: { paste: string; zip: string; folder: string };
    inputMethod: string;
    validateFor: string;
    targetPortable: string;
    targetClaudeCode: string;
    goodExample: string;
    brokenExample: string;
    dropZip: string;
    dropZipHint: string;
    chooseFolder: string;
    chooseFolderHint: string;
    noSkill: string;
    noSkillZip: string;
    noSkillFolder: string;
    file: string;
    files: string;
    verdictInvalid: string;
    verdictWarnings: string;
    verdictValid: string;
    summaryWarnings: string;
    summaryValid: string;
    summaryInvalid: (n: number) => string;
    grade: (g: string) => string;
    of100: string;
    description: string;
    bodyLines: string;
    bodyTokens: string;
    filesLabel: string;
    noIssuesLong: string;
    zipError: (name: string, message: string) => string;
    ariaLabel: string;
  };
  robots: {
    check: string; generate: string; llms: string;
    example: string; drafts: string;
    summary: (n: number) => string;
    training: string; search: string; usageRules: string; token: string;
    partial: (n: number) => string;
    ietf: string; against: string; inFavor: string; none: string;
    exceptions: (n: number) => string; shared: string;
  };
  schema: { schema: string; playground: string; openai: string };
  mcp: { inspect: string; curl: string; config: string; generate: string; checkJson: string };
  agents: { check: string; generate: string };
  cursor: {
    validate: string;
    build: string;
    ruleType: string;
    legacy: string;
    unknown: string;
    legacyHint: string;
    types: Record<"always" | "intelligent" | "files" | "manual", { label: string; help: string }>;
  };
  tokens: { mcp: string; small: string; plain: string };
  sampling: { omit: string; temp0: string; temp1: string; sonnet5: string };
};

const en: Chrome = {
  sev: {
    error: { one: "error", many: "errors", title: "Errors" },
    warning: { one: "warning", many: "warnings", title: "Warnings" },
    tip: { one: "tip", many: "tips", title: "Tips" },
  },
  copy: "Copy",
  copied: "Copied",
  download: "Download",
  clear: "Clear",
  fix: "Fix:",
  source: "Source",
  spec: "Spec",
  line: (n) => `line ${n}`,
  noIssues: "No issues found.",
  localNote: "Checked locally. Nothing you paste is uploaded.",
  showInEditor: "Show in editor",
  validator: {
    tabs: { paste: "Paste SKILL.md", zip: "Upload .zip", folder: "Upload folder" },
    inputMethod: "Input method",
    validateFor: "Validate for",
    targetPortable: "claude.ai, API & Agent Skills spec",
    targetClaudeCode: "Claude Code",
    goodExample: "Good example",
    brokenExample: "Broken example",
    dropZip: "Drop a skill .zip here",
    dropZipHint: "Or click to browse. The archive is unpacked in your browser.",
    chooseFolder: "Choose your skill folder",
    chooseFolderHint: "Pick the folder that contains SKILL.md. Files are read in your browser.",
    noSkill: "No skill loaded yet",
    noSkillZip: "Drop a .zip on the left to get a score and fixes.",
    noSkillFolder: "Choose a folder on the left to get a score and fixes.",
    file: "file",
    files: "files",
    verdictInvalid: "Invalid skill",
    verdictWarnings: "Valid, with warnings",
    verdictValid: "Valid skill",
    summaryWarnings: "Claude will accept this skill. Fix the warnings so it triggers reliably.",
    summaryValid: "Ready to upload. Nothing blocks this skill.",
    summaryInvalid: (n) =>
      n === 1
        ? "Fix the error below before uploading. Uploads with these problems are rejected or never trigger."
        : `Fix the ${n} errors below before uploading. Uploads with these problems are rejected or never trigger.`,
    grade: (g) => `Grade ${g}`,
    of100: "of 100",
    description: "Description",
    bodyLines: "Body lines",
    bodyTokens: "Body tokens",
    filesLabel: "Files",
    noIssuesLong: "No issues found. This skill follows every rule we check.",
    zipError: (name, message) => `Could not read ${name} as a zip: ${message}`,
    ariaLabel: "SKILL.md content",
  },
  robots: {
    check: "Check robots.txt", generate: "Generate", llms: "llms.txt",
    example: "Example", drafts: "Draft signals",
    summary: (n) => `${n} AI user agents · RFC 9309 matching · IETF aipref drafts`,
    training: "Training bots blocked", search: "AI search bots allowed", usageRules: "Content-Usage rules", token: "__usage_ai-training",
    partial: (n) => `${n} partial`,
    ietf: "IETF draft", against: "Against", inFavor: "In favor", none: "None",
    exceptions: (n) => `AI training at / · ${n} exception${n === 1 ? "" : "s"}`,
    shared: "Shared token draft",
  },
  schema: { schema: "Schema", playground: "Playground", openai: "OpenAI strict" },
  mcp: { inspect: "Inspector", curl: "Test curl", config: "Config", generate: "Generate", checkJson: "Check JSON" },
  agents: { check: "Check", generate: "Generate" },
  cursor: {
    validate: "Validate",
    build: "Build a rule",
    ruleType: "Rule type",
    legacy: "Legacy file",
    unknown: "Unknown",
    legacyHint: "Legacy, will be deprecated",
    types: {
      always: { label: "Always Apply", help: "Added to every Agent chat." },
      intelligent: { label: "Apply Intelligently", help: "The Agent reads the description and decides whether the rule is relevant." },
      files: { label: "Apply to Specific Files", help: "Attached when files matching the globs are in the conversation." },
      manual: { label: "Apply Manually", help: "Only used when someone @-mentions the rule." },
    },
  },
  tokens: { mcp: "MCP result", small: "Small result", plain: "Plain text" },
  sampling: { omit: "Omitted", temp0: "temperature 0", temp1: "temperature 1", sonnet5: "Sonnet 5" },
};

const zh: Chrome = {
  sev: {
    error: { one: "个错误", many: "个错误", title: "错误" },
    warning: { one: "条警告", many: "条警告", title: "警告" },
    tip: { one: "条提示", many: "条提示", title: "提示" },
  },
  copy: "复制",
  copied: "已复制",
  download: "下载",
  clear: "清空",
  fix: "修复：",
  source: "来源",
  spec: "规范",
  line: (n) => `第 ${n} 行`,
  noIssues: "没有发现问题。",
  localNote: "在本地检查。你粘贴的内容不会被上传。",
  showInEditor: "在编辑器中显示",
  validator: {
    tabs: { paste: "粘贴 SKILL.md", zip: "上传 .zip", folder: "上传文件夹" },
    inputMethod: "输入方式",
    validateFor: "校验目标",
    targetPortable: "claude.ai、API 与 Agent Skills 规范",
    targetClaudeCode: "Claude Code",
    goodExample: "正确示例",
    brokenExample: "错误示例",
    dropZip: "把 skill 的 .zip 拖到这里",
    dropZipHint: "也可以点击选择。压缩包在浏览器里解压。",
    chooseFolder: "选择 skill 文件夹",
    chooseFolderHint: "选择包含 SKILL.md 的文件夹。文件在浏览器里读取。",
    noSkill: "还没有载入 skill",
    noSkillZip: "把 .zip 拖到左侧，即可看到分数和修改建议。",
    noSkillFolder: "在左侧选择文件夹，即可看到分数和修改建议。",
    file: "个文件",
    files: "个文件",
    verdictInvalid: "无效的 skill",
    verdictWarnings: "有效，但有警告",
    verdictValid: "有效的 skill",
    summaryWarnings: "Claude 会接受这个 skill。修好警告后，触发会更稳定。",
    summaryValid: "可以上传。没有阻断项。",
    summaryInvalid: (n) => `上传前请先修复下面 ${n} 个错误。带这些问题的上传会被拒绝，或永远不会被触发。`,
    grade: (g) => `等级 ${g}`,
    of100: "满分 100",
    description: "描述",
    bodyLines: "正文行数",
    bodyTokens: "正文 token",
    filesLabel: "文件",
    noIssuesLong: "没有发现问题。这个 skill 通过了我们检查的每一条规则。",
    zipError: (name, message) => `无法把 ${name} 当作 zip 读取：${message}`,
    ariaLabel: "SKILL.md 内容",
  },
  robots: {
    check: "检查 robots.txt", generate: "生成", llms: "llms.txt",
    example: "示例", drafts: "草案信号",
    summary: (n) => `${n} 个 AI user-agent · 按 RFC 9309 匹配 · IETF aipref 草案`,
    training: "训练已屏蔽", search: "搜索已允许", usageRules: "Content-Usage", token: "__usage_ai-training",
    partial: (n) => `${n} 个部分`,
    ietf: "IETF 草案", against: "反对", inFavor: "赞成", none: "无",
    exceptions: (n) => `/ · ${n} 个例外`,
    shared: "共享令牌草案",
  },
  schema: { schema: "Schema", playground: "演练场", openai: "OpenAI 严格模式" },
  mcp: { inspect: "检查工具", curl: "测试 curl", config: "配置", generate: "生成", checkJson: "检查 JSON" },
  agents: { check: "检查", generate: "生成" },
  cursor: {
    validate: "校验",
    build: "生成规则",
    ruleType: "规则类型",
    legacy: "旧版文件",
    unknown: "未知",
    legacyHint: "旧格式，将会被弃用",
    types: {
      always: { label: "始终应用", help: "每次 Agent 对话都会带上。" },
      intelligent: { label: "智能应用", help: "Agent 阅读描述后，自行判断这条规则是否相关。" },
      files: { label: "匹配文件时应用", help: "对话里出现符合 glob 的文件时附上。" },
      manual: { label: "手动应用", help: "只有有人 @ 提到这条规则时才使用。" },
    },
  },
  tokens: { mcp: "MCP 结果", small: "短结果", plain: "纯文本" },
  sampling: { omit: "省略参数", temp0: "temperature 0", temp1: "temperature 1", sonnet5: "Sonnet 5" },
};

export function chrome(locale: Locale): Chrome {
  return locale === "zh" ? zh : en;
}

export function sevCount(locale: Locale, kind: "error" | "warning" | "tip", n: number): string {
  const unit = chrome(locale).sev[kind];
  return `${n} ${n === 1 ? unit.one : unit.many}`;
}
