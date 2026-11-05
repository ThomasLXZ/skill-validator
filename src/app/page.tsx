import { HomePage, homeMeta } from "@/views/home";

export const metadata = homeMeta("en");

export default function Page() {
  return <HomePage locale="en" />;
}
