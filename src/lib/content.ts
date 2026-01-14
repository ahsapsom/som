import { unstable_noStore as noStore } from "next/cache";

import { readContent } from "@/lib/contentStore";

export async function getContent() {
  noStore();
  return readContent();
}

