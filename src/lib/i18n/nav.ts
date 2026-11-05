import type { Locale } from "./routing";

export type NavGroupId = "tools" | "learn";

export type NavItem = {
  href: string;
  group: NavGroupId;
  label: Record<Locale, string>;
  short: Record<Locale, string>;
  blurb: Record<Locale, string>;
};

export const NAV_GROUPS: { id: NavGroupId; label: Record<Locale, string> }[] = [
  { id: "tools", label: { en: "Tools", zh: "工具" } },
  { id: "learn", label: { en: "Learn", zh: "学习" } },
];

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    group: "tools",
    label: { en: "Skill Validator", zh: "Skill 校验" },
    short: { en: "Skills", zh: "Skill" },
    blurb: { en: "Check a SKILL.md before you upload it.", zh: "上传前先检查 SKILL.md。" },
  },
  {
    href: "/agents-md/",
    group: "tools",
    label: { en: "AGENTS.md", zh: "AGENTS.md" },
    short: { en: "AGENTS.md", zh: "AGENTS.md" },
    blurb: { en: "Validate and generate repo instructions for coding agents.", zh: "检查并生成仓库说明，供编程 agent 读取。" },
  },
  {
    href: "/json-schema/",
    group: "tools",
    label: { en: "JSON Schema", zh: "JSON Schema" },
    short: { en: "Schema", zh: "Schema" },
    blurb: { en: "Draft-07, enums, and OpenAI strict structured output.", zh: "检查 draft-07 和 enum，以及 OpenAI 严格模式下的结构化输出。" },
  },
  {
    href: "/mcp/",
    group: "tools",
    label: { en: "MCP", zh: "MCP" },
    short: { en: "MCP", zh: "MCP" },
    blurb: { en: "Inspect tools, write curl, and generate a client config.", zh: "检查工具列表，写出 curl，并生成客户端配置。" },
  },
  {
    href: "/text-watermark/",
    group: "tools",
    label: { en: "Text watermark", zh: "文本水印" },
    short: { en: "Watermark", zh: "水印" },
    blurb: { en: "See if sampling parameters would drop Claude’s watermark.", zh: "看采样参数会不会丢掉 Claude 的文本水印。" },
  },
  {
    href: "/robots-ai/",
    group: "tools",
    label: { en: "robots.txt AI", zh: "robots.txt AI" },
    short: { en: "robots.txt", zh: "robots.txt" },
    blurb: { en: "Which AI crawlers can read your site, and how to say no.", zh: "看哪些 AI 爬虫能读你的站点，以及怎样拒绝。" },
  },
  {
    href: "/tool-result-size/",
    group: "tools",
    label: { en: "Token counter", zh: "Token 计数" },
    short: { en: "Tokens", zh: "Token" },
    blurb: { en: "Estimate the size of an MCP tool result.", zh: "估算一条 MCP 工具结果有多少 token。" },
  },
  {
    href: "/cursor-rules/",
    group: "tools",
    label: { en: "Cursor rules", zh: "Cursor 规则" },
    short: { en: "Cursor", zh: "Cursor" },
    blurb: { en: "Validate .mdc frontmatter and build a rule file.", zh: "检查 .mdc 前言，并生成规则文件。" },
  },
  {
    href: "/learn/mcp-tool-vs-resource-vs-prompt/",
    group: "learn",
    label: { en: "Tool vs resource vs prompt", zh: "工具、资源与提示" },
    short: { en: "Three primitives", zh: "三种原语" },
    blurb: { en: "Who decides to use each MCP primitive.", zh: "看谁来决定使用这三种 MCP 原语。" },
  },
  {
    href: "/learn/mcp-server-shi-shenme/",
    group: "learn",
    label: { en: "What is an MCP server", zh: "MCP 是什么" },
    short: { en: "What is MCP", zh: "是什么" },
    blurb: { en: "One handshake, and how a server differs from the model.", zh: "用一次握手，说明 server 和模型有什么不同。" },
  },
];

export function navItems(group: NavGroupId): NavItem[] {
  return NAV_ITEMS.filter((item) => item.group === group);
}

export const UI = {
  brand: "Skill Validator",
  language: { en: "Language", zh: "语言" },
  menu: { en: "Open menu", zh: "打开菜单" },
  closeMenu: { en: "Close menu", zh: "关闭菜单" },
  mainNav: { en: "Main", zh: "主导航" },
  theme: { en: "Toggle color theme", zh: "切换颜色主题" },
  current: { en: "Current page", zh: "当前页面" },
  footer: {
    en: "Free developer tools for AI agents. Everything runs in your browser; nothing you paste is uploaded.",
    zh: "这些免费工具给 AI agent 使用，都在浏览器里运行，你粘贴的内容不会被上传。",
  },
} as const;
