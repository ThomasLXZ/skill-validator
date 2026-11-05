import { WatermarkPage, watermarkMeta } from "@/views/text-watermark";

export const metadata = watermarkMeta("en");
export default function Page() { return <WatermarkPage locale="en" />; }
