import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Starting database seed...");

  // 1. Ensure pgvector extension exists if supported by Postgres instance
  try {
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`);
    console.log("✓ pgvector extension verified/created.");
  } catch (error) {
    console.warn("Notice: pgvector extension creation skipped or not supported on this instance:", error);
  }

  // 2. Hash password for demo and test users
  const hashedPassword = await bcrypt.hash("demo123456", 10);

  // 3. Upsert Demo User
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@synapserag.ai" },
    update: {
      name: "Demo Explorer",
      role: "DEMO",
      isDemo: true,
    },
    create: {
      email: "demo@synapserag.ai",
      name: "Demo Explorer",
      password: hashedPassword,
      role: "DEMO",
      isDemo: true,
    },
  });

  console.log(`✓ Demo user ready: ${demoUser.email} (ID: ${demoUser.id})`);

  // 4. Create or update Demo Knowledge Base
  let demoKb = await prisma.knowledgeBase.findFirst({
    where: { userId: demoUser.id, name: "Acme Cloud Support AI" },
  });

  if (!demoKb) {
    demoKb = await prisma.knowledgeBase.create({
      data: {
        userId: demoUser.id,
        name: "Acme Cloud Support AI",
        description: "Intelligent support bot for Acme Cloud enterprise infrastructure, pricing, and SLAs.",
        prompt:
          "You are an expert Acme Cloud support assistant. Answer user queries strictly using the provided documents. Cite sources using [Doc X] notation. If the answer is not contained in the context, explicitly say: 'I do not know based on the provided documents.'",
        colorCode: "#06b6d4",
        isPublic: true,
      },
    });
    console.log(`✓ Created demo Knowledge Base: ${demoKb.name}`);
  }

  // 5. Pre-populate sample documents if none exist
  const existingDocs = await prisma.document.count({
    where: { kbId: demoKb.id },
  });

  if (existingDocs === 0) {
    const doc1 = await prisma.document.create({
      data: {
        kbId: demoKb.id,
        name: "Acme_Cloud_SLA_and_Pricing.pdf",
        type: "PDF",
        status: "READY",
        fileSize: 1048576,
      },
    });

    const doc2 = await prisma.document.create({
      data: {
        kbId: demoKb.id,
        name: "Acme_Security_and_Compliance.md",
        type: "MD",
        status: "READY",
        fileSize: 524288,
      },
    });

    // Seed sample chunks for doc 1
    await prisma.documentChunk.createMany({
      data: [
        {
          documentId: doc1.id,
          chunkIndex: 0,
          tokenCount: 140,
          content:
            "Acme Cloud Service Level Agreement (SLA): We guarantee 99.99% monthly uptime for all Enterprise tier clusters. If monthly uptime drops below 99.9%, customers are entitled to a 25% service credit. Below 99.0%, a 50% credit applies upon submitting a claim within 30 days.",
        },
        {
          documentId: doc1.id,
          chunkIndex: 1,
          tokenCount: 120,
          content:
            "Pricing Tiers: The Starter tier begins at $49/month including 5GB storage and 100k API calls. The Pro tier is $199/month with 50GB storage and unlimited API calls. Enterprise pricing starts at $899/month with dedicated VPC peering and custom SLA guarantees.",
        },
      ],
    });

    // Seed sample chunks for doc 2
    await prisma.documentChunk.createMany({
      data: [
        {
          documentId: doc2.id,
          chunkIndex: 0,
          tokenCount: 135,
          content:
            "Security & Compliance Standards: Acme Cloud is certified SOC 2 Type II, ISO 27001, and HIPAA compliant. All customer data is encrypted at rest using AES-256 and in transit using TLS 1.3 with strict HSTS enforcement.",
        },
        {
          documentId: doc2.id,
          chunkIndex: 1,
          tokenCount: 110,
          content:
            "Data Retention and Privacy: Customer data stored in vector indexes is never used to train global public foundation models. Organizations can request complete cryptographic erasure of their data with immediate purge within 7 business days.",
        },
      ],
    });

    console.log("✓ Pre-populated demo documents and knowledge chunks.");
  }

  console.log("🎉 Seed finished successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
