import Link from "next/link";
import SchemaTool from "@/components/tools/SchemaTool";
import { ContentSection, Faq, faqJsonLd, Sources, ToolPage } from "@/components/tools/PageShell";
import { REF } from "@/lib/json-schema";
import { pageMeta, SITE } from "@/lib/site";

const PATH = "/json-schema/";
const TITLE = "JSON Schema Validator: Draft-07, Enums, and OpenAI Structured Outputs";
const DESC = "Validate JSON Schema online, including draft-07 and enum checks, then test a JSON instance. A structured-output playground flags schemas OpenAI strict mode rejects.";

export const metadata = pageMeta({
  title: TITLE,
  description: DESC,
  path: PATH,
  keywords: [
    "validate json schema online", "json schema draft 7", "json schema enum",
    "openai structured output validator", "structured output playground", "json schema checker",
  ],
});

const FAQ = [
  { q: "Which JSON Schema draft does this check?", a: "It reads $schema. Draft-07 is the default when the keyword is missing, which is what most “validate JSON Schema online” tools assume. Draft-04, 2019-09, and 2020-12 are recognised. exclusiveMinimum is a boolean in draft-04 and a number in draft-07, and this checker flags the mix." },
  { q: "What does the enum check look for?", a: "enum must be a non-empty array. Repeated values are a warning because draft-07 says they should be unique. A value whose JSON type disagrees with type is a warning, for example a number inside an enum declared as string." },
  { q: "Is the playground a full draft-07 validator?", a: "It evaluates the keywords people hit most: type, enum, const, required, properties, additionalProperties, items, numeric and string bounds, pattern, allOf, anyOf, oneOf, not, and local $ref. patternProperties, if/then/else, and unevaluated keywords are reported as skipped rather than silently treated as passing." },
  { q: "Why does OpenAI reject a schema that is valid JSON Schema?", a: "Structured Outputs with strict: true uses a subset. The root must be an object and must not be anyOf. Every object needs additionalProperties: false, and every property must be listed in required. allOf, oneOf, and if/then/else are not supported. Optional fields are a nullable type that is still required." },
];

export default function Page() {
  return (
    <ToolPage
      eyebrow="JSON Schema and structured output"
      title="Validate JSON Schema online"
      lead={<>Paste a schema to check draft-07 shape and enums, validate an instance against it, or see whether OpenAI strict structured outputs will accept it. A <Link className="underline decoration-border underline-offset-4 hover:decoration-foreground" href="/tool-result-size/">token counter</Link> is separate, for when the schema or the model’s JSON is large.</>}
      bullets={["Draft-07 by default", "Enum and $ref checks", "OpenAI strict subset"]}
      tool={<SchemaTool />}
      jsonLd={{ "@context": "https://schema.org", "@graph": [
        { "@type": "WebApplication", name: "JSON Schema Validator", url: `${SITE}${PATH}`, applicationCategory: "DeveloperApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: DESC },
        faqJsonLd(FAQ),
      ] }}
    >
      <ContentSection title="What strict mode adds" muted intro="A schema can be valid draft-07 and still fail Structured Outputs. The third tab checks the constraints in OpenAI’s guide.">
        <div className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Root object", "type object at the root. anyOf at the root is rejected; put the union on a property."],
            ["Closed objects", "additionalProperties: false on every object, including objects inside anyOf and $defs."],
            ["All fields required", "Every key in properties is listed in required. Model an optional field as [\"string\", \"null\"]."],
            ["Supported keywords", "string, number, integer, boolean, object, array, enum, anyOf, and the documented string, number, and array constraints."],
            ["Not in the subset", "allOf, oneOf, not, if/then/else, and tuple items (an array of schemas)."],
            ["Size limits", "5,000 properties, 10 levels of object nesting, 1,000 enum values, and a 120,000 character budget for names and enum strings."],
          ].map(([t, d]) => (
            <div key={t} className="bg-background p-5">
              <h3 className="text-[15px] font-medium">{t}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </ContentSection>
      <ContentSection title="Sources">
        <Sources items={[
          { label: "JSON Schema draft-07 validation", href: REF.draft07, note: "enum, numeric and string keywords, required." },
          { label: "JSON Schema draft-07 core", href: REF.core07, note: "$ref, $schema, and the change to exclusiveMinimum." },
          { label: "OpenAI Structured Outputs", href: REF.openai, note: "Subset, additionalProperties, required, nesting and enum limits." },
        ]} />
      </ContentSection>
      <ContentSection title="FAQ" muted><Faq items={FAQ} /></ContentSection>
    </ToolPage>
  );
}
