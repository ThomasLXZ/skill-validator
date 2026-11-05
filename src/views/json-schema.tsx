import Link from "next/link";
import SchemaTool from "@/components/tools/SchemaTool";
import { ContentSection, Faq, faqJsonLd, Sources, ToolPage } from "@/components/tools/PageShell";
import { REF } from "@/lib/json-schema";
import { localePath, type Locale } from "@/lib/i18n/routing";
import { pageMeta, SITE } from "@/lib/site";
import { InfoGrid, textLink } from "./bits";

const PATH = "/json-schema/";

const copy = {
  en: {
    title: "JSON Schema Validator: Draft-07, Enums, and OpenAI Structured Outputs",
    description: "Validate JSON Schema online, including draft-07 and enum checks, then test a JSON instance. A structured-output playground flags schemas OpenAI strict mode rejects.",
    keywords: ["validate json schema online", "json schema draft 7", "json schema enum", "openai structured output validator", "structured output playground", "json schema checker"],
    eyebrow: "JSON Schema and structured output",
    h1: "Validate JSON Schema online",
    bullets: ["Draft-07 by default", "Enum and $ref checks", "OpenAI strict subset"],
    appName: "JSON Schema Validator",
    strictTitle: "What strict mode adds",
    strictIntro: "A schema can be valid draft-07 and still fail Structured Outputs. The third tab checks the constraints in OpenAI’s guide.",
    cards: [
      ["Root object", "type object at the root. anyOf at the root is rejected; put the union on a property."],
      ["Closed objects", "additionalProperties: false on every object, including objects inside anyOf and $defs."],
      ["All fields required", "Every key in properties is listed in required. Model an optional field as [\"string\", \"null\"]."],
      ["Supported keywords", "string, number, integer, boolean, object, array, enum, anyOf, and the documented string, number, and array constraints."],
      ["Not in the subset", "allOf, oneOf, not, if/then/else, and tuple items (an array of schemas)."],
      ["Size limits", "5,000 properties, 10 levels of object nesting, 1,000 enum values, and a 120,000 character budget for names and enum strings."],
    ],
    sourcesTitle: "Sources",
    faqTitle: "FAQ",
    faq: [
      { q: "Which JSON Schema draft does this check?", a: "It reads $schema. Draft-07 is the default when the keyword is missing, which is what most “validate JSON Schema online” tools assume. Draft-04, 2019-09, and 2020-12 are recognised. exclusiveMinimum is a boolean in draft-04 and a number in draft-07, and this checker flags the mix." },
      { q: "What does the enum check look for?", a: "enum must be a non-empty array. Repeated values are a warning because draft-07 says they should be unique. A value whose JSON type disagrees with type is a warning, for example a number inside an enum declared as string." },
      { q: "Is the playground a full draft-07 validator?", a: "It evaluates the keywords people hit most: type, enum, const, required, properties, additionalProperties, items, numeric and string bounds, pattern, allOf, anyOf, oneOf, not, and local $ref. patternProperties, if/then/else, and unevaluated keywords are reported as skipped rather than silently treated as passing." },
      { q: "Why does OpenAI reject a schema that is valid JSON Schema?", a: "Structured Outputs with strict: true uses a subset. The root must be an object and must not be anyOf. Every object needs additionalProperties: false, and every property must be listed in required. allOf, oneOf, and if/then/else are not supported. Optional fields are a nullable type that is still required." },
    ],
    sources: [
      { label: "JSON Schema draft-07 validation", href: REF.draft07, note: "enum, numeric and string keywords, required." },
      { label: "JSON Schema draft-07 core", href: REF.core07, note: "$ref, $schema, and the change to exclusiveMinimum." },
      { label: "OpenAI Structured Outputs", href: REF.openai, note: "Subset, additionalProperties, required, nesting and enum limits." },
    ],
  },
  zh: {
    title: "JSON Schema 校验：Draft-07、枚举与 OpenAI 结构化输出",
    description: "在线校验 JSON Schema，包括 draft-07 和 enum，再拿一份 JSON 实例试跑。结构化输出演练场会标出 OpenAI 严格模式会拒绝的 schema。",
    keywords: ["在线校验 JSON Schema", "json schema draft 7", "json schema enum", "openai 结构化输出", "structured output playground"],
    eyebrow: "JSON Schema 与结构化输出",
    h1: "在线校验 JSON Schema",
    bullets: ["默认按 Draft-07", "检查 enum 和 $ref", "OpenAI 严格子集"],
    appName: "JSON Schema 校验器",
    strictTitle: "严格模式额外要求什么",
    strictIntro: "一份 schema 可以是合法的 draft-07，仍然通不过 Structured Outputs。第三个标签按 OpenAI 指南里的约束来查。",
    cards: [
      ["根必须是对象", "根上的 type 是 object。根上的 anyOf 会被拒绝，把联合类型放到某个属性上。"],
      ["对象必须封闭", "每个对象都要 additionalProperties: false，包括 anyOf 和 $defs 里面的对象。"],
      ["字段全部必填", "properties 里的每个键都要出现在 required 中。可选字段写成 [\"string\", \"null\"]。"],
      ["支持的关键字", "string、number、integer、boolean、object、array、enum、anyOf，以及文档里的字符串、数字和数组约束。"],
      ["不在子集里", "allOf、oneOf、not、if/then/else，以及元组 items（schema 数组）。"],
      ["规模上限", "5000 个属性、对象嵌套 10 层、1000 个 enum 值，名称和 enum 字符串合计 120000 个字符。"],
    ],
    sourcesTitle: "来源",
    faqTitle: "常见问题",
    faq: [
      { q: "它检查哪一版 JSON Schema？", a: "它读取 $schema。缺少这个关键字时默认 draft-07，这也是多数“在线校验 JSON Schema”工具的假设。draft-04、2019-09 和 2020-12 能被识别。exclusiveMinimum 在 draft-04 里是布尔值，在 draft-07 里是数字，混用会被标出。" },
      { q: "enum 检查看什么？", a: "enum 必须是非空数组。重复值是警告，因为 draft-07 要求它们应当唯一。值和 type 的 JSON 类型不一致也是警告，例如声明为 string 的 enum 里放了一个数字。" },
      { q: "演练场是完整的 draft-07 校验器吗？", a: "它计算人们最常碰到的关键字：type、enum、const、required、properties、additionalProperties、items、数值和字符串边界、pattern、allOf、anyOf、oneOf、not，以及本地 $ref。patternProperties、if/then/else 和 unevaluated 关键字会被报告为跳过，而不是悄悄当成通过。" },
      { q: "为什么合法的 JSON Schema 会被 OpenAI 拒绝？", a: "strict: true 的 Structured Outputs 只用一个子集。根必须是对象，而且不能是 anyOf。每个对象都要 additionalProperties: false，每个属性都要列在 required 里。不支持 allOf、oneOf 和 if/then/else。可选字段是仍然必填的可空类型。" },
    ],
    sources: [
      { label: "JSON Schema draft-07 校验", href: REF.draft07, note: "enum、数值和字符串关键字、required。" },
      { label: "JSON Schema draft-07 核心", href: REF.core07, note: "$ref、$schema，以及 exclusiveMinimum 的变化。" },
      { label: "OpenAI Structured Outputs", href: REF.openai, note: "子集、additionalProperties、required、嵌套和 enum 上限。" },
    ],
  },
} as const;

export function schemaMeta(locale: Locale) {
  const c = copy[locale];
  return pageMeta({ title: c.title, description: c.description, path: PATH, locale, keywords: [...c.keywords] });
}

export function SchemaPage({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const counter = locale === "zh" ? "token 计数" : "token counter";
  return (
    <ToolPage
      locale={locale}
      eyebrow={c.eyebrow}
      title={c.h1}
      lead={<>{locale === "zh"
        ? "粘贴一份 schema，检查 draft-07 的形状和 enum，用实例验证，或看 OpenAI 严格结构化输出会不会接受它。schema 或模型返回的 JSON 很大时，用单独的"
        : "Paste a schema to check draft-07 shape and enums, validate an instance against it, or see whether OpenAI strict structured outputs will accept it. A"}{" "}
        <Link className={textLink} href={localePath(locale, "/tool-result-size/")}>{counter}</Link>
        {locale === "zh" ? "。" : " is separate, for when the schema or the model’s JSON is large."}
      </>}
      bullets={[...c.bullets]}
      tool={<SchemaTool />}
      jsonLd={{ "@context": "https://schema.org", "@graph": [
        { "@type": "WebApplication", name: c.appName, url: `${SITE}${localePath(locale, PATH)}`, inLanguage: locale === "zh" ? "zh-Hans" : "en", applicationCategory: "DeveloperApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: c.description },
        faqJsonLd([...c.faq]),
      ] }}
    >
      <ContentSection title={c.strictTitle} muted intro={c.strictIntro}>
        <InfoGrid items={c.cards.map(([t, d]) => ({ t, d }))} />
      </ContentSection>
      <ContentSection title={c.sourcesTitle}>
        <Sources items={c.sources.map((s) => ({ ...s }))} />
      </ContentSection>
      <ContentSection title={c.faqTitle} muted><Faq items={[...c.faq]} /></ContentSection>
    </ToolPage>
  );
}
