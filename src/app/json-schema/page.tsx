import { SchemaPage, schemaMeta } from "@/views/json-schema";

export const metadata = schemaMeta("en");
export default function Page() { return <SchemaPage locale="en" />; }
