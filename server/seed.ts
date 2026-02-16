import { db, pool } from "./db";
import { users, campaigns, applications } from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  console.log("Seeding database...");
  
  // Clear existing data
  await db.delete(applications);
  await db.delete(campaigns);
  await db.delete(users);

  const hashedPassword = await hashPassword("password");

  // Users
  const [company] = await db.insert(users).values({
    // username: "techflow", // Removed
    password: hashedPassword,
    role: "company",
    name: "TechFlow Inc.",
    email: "contact@techflow.com",
    companyName: "TechFlow",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=TF",
    isVerified: true, // Auto-verify seeded users
  }).returning();

  const [creator1] = await db.insert(users).values({
    // username: "alex", // Removed
    password: hashedPassword,
    role: "creator",
    name: "Alex Creator",
    email: "alex@creator.com",
    bio: "Tech reviewer and lifestyle vlogger. Passionate about gadgets.",
    niche: ["tech", "lifestyle"],
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    instagram: "@alex.tech",
    youtube: "youtube.com/alextech",
    tiktok: "tiktok.com/@alextech",
    pixKey: "alex@pix.com.br",
    cpf: "123.456.789-00",
    phone: "(11) 99999-9999",
    cep: "01001-000",
    street: "Praça da Sé",
    number: "1",
    neighborhood: "Sé",
    city: "São Paulo",
    state: "SP",
    isVerified: true, // Auto-verify seeded users
  }).returning();

  const [creator2] = await db.insert(users).values({
    // username: "sarah", // Removed
    password: hashedPassword,
    role: "creator",
    name: "Sarah Design",
    email: "sarah@design.com",
    bio: "Digital artist and creative director. Sharing my process.",
    niche: ["beauty", "lifestyle"],
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    isVerified: true, // Auto-verify seeded users
  }).returning();

  // Campaigns
  const [campaign1] = await db.insert(campaigns).values({
    companyId: company.id,
    title: "Summer Tech Review Series",
    description: "We are launching a new line of smart home devices and need authentic reviews from tech enthusiasts. You will receive a full kit including our smart hub, bulbs, and sensors.",
    requirements: ["Must have 50k+ followers on YouTube or TikTok", "Tech focused audience"],
    budget: "$500 + Products",
    deadline: "2024-06-30",
    creatorsNeeded: 5,
    status: "open"
  }).returning();

  const [campaign2] = await db.insert(campaigns).values({
    companyId: company.id,
    title: "Lifestyle Integration Launch",
    description: "Showcase how our app helps you organize your daily creative workflow. We want aesthetic, cozy desk setups and productivity tips.",
    requirements: ["Instagram focus", "Aesthetic feed", "10k+ followers"],
    budget: "$200",
    deadline: "2024-07-15",
    creatorsNeeded: 10,
    status: "open"
  }).returning();

  // Applications
  await db.insert(applications).values({
    campaignId: campaign1.id,
    creatorId: creator2.id, // Sarah applying to Tech campaign
    status: "pending",
    message: "I would love to review the design aspects of your smart home hub!"
  });

  console.log("Seeding complete!");
  pool.end();
}

seed().catch(console.error);
