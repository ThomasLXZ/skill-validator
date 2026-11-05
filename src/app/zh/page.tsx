import { HomePage, homeMeta } from "@/views/home";

export const metadata = homeMeta("zh");

export default function Page() {
  return <HomePage locale="zh" />;
}
