import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
      isDemo?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    isDemo?: boolean;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        isDemo: { label: "isDemo", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null;
        }

        const email = String(credentials.email).toLowerCase().trim();

        // 1. Handle Demo Account One-Click Login
        if (credentials.isDemo === "true" || email === "demo@synapserag.ai") {
          let demoUser = await prisma.user.findFirst({
            where: { isDemo: true },
          });

          if (!demoUser) {
            demoUser = await prisma.user.create({
              data: {
                email: "demo@synapserag.ai",
                name: "Demo Explorer",
                role: "DEMO",
                isDemo: true,
              },
            });
          }

          return {
            id: demoUser.id,
            name: demoUser.name,
            email: demoUser.email,
            role: demoUser.role,
            isDemo: demoUser.isDemo,
          };
        }

        // 2. Standard Email/Password User Authentication
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordStr = String(credentials.password);
        const isValid = await bcrypt.compare(passwordStr, user.password);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isDemo: user.isDemo,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isDemo = user.isDemo;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.isDemo = token.isDemo as boolean;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  secret: process.env.AUTH_SECRET || "synapse_rag_super_secret_jwt_key_at_least_32_chars_long",
});
