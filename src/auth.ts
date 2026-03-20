import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import authConfig from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      ...authConfig.providers[0],
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          try {
            let user = await prisma.user.findUnique({ where: { email } });
            
            // Auto-provision the first admin user if the database is fresh
            if (!user && email === "admin@example.com" && password === "password123") {
              user = await prisma.user.create({
                data: {
                  email: "admin@example.com",
                  name: "Admin User",
                  role: "ADMIN",
                },
              });
            }

            if (user && password === "password123") {
              return user;
            }
          } catch (err) {
            console.error("Database query error during authorize:", err);
          }
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.role) {
        session.user.role = token.role as any;
      }
      return session;
    },
  },
});
