import { db } from "./db";
import { tags } from "@shared/schema";
import { sql } from "drizzle-orm";

const baseTags = [
  { name: "Moda", type: "niche" as const },
  { name: "Beleza", type: "niche" as const },
  { name: "Fitness", type: "niche" as const },
  { name: "Casa", type: "niche" as const },
  { name: "Pets", type: "niche" as const },
  { name: "Infantil", type: "niche" as const },
  { name: "Tecnologia", type: "niche" as const },
  { name: "Alimentos", type: "niche" as const },
  { name: "Bebidas", type: "niche" as const },
  { name: "Saúde", type: "niche" as const },
  { name: "Serviços", type: "niche" as const },
  { name: "Outros", type: "niche" as const },
  { name: "Instagram", type: "platform" as const },
  { name: "TikTok", type: "platform" as const },
  { name: "YouTube", type: "platform" as const },
];

export async function seedTags() {
  console.log("Seeding taxonomy tags...");
  
  let created = 0;
  let skipped = 0;
  
  for (const tag of baseTags) {
    try {
      await db.insert(tags)
        .values(tag)
        .onConflictDoNothing();
      created++;
    } catch (error) {
      skipped++;
    }
  }
  
  console.log(`Tags seeded: ${created} created, ${skipped} skipped (already exist)`);
  return { created, skipped };
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  seedTags()
    .then(() => {
      console.log("Tag seeding complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error seeding tags:", error);
      process.exit(1);
    });
}
