import "dotenv/config";
import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const typeDefs = `
  type User { id: Int email: String }
  type AuthPayload { token: String email: String }
  type Query { me: User }
  type Mutation {
    signup(email: String!, password: String!): AuthPayload
    login(email: String!, password: String!): AuthPayload
  }
`;

const resolvers = {
  Query: {
    me: async (_: unknown, __: unknown, ctx: { userId?: number }) => {
      if (!ctx.userId) throw new Error("Not authenticated");
      return prisma.user.findUnique({ where: { id: ctx.userId } });
    },
  },
  Mutation: {
    signup: async (_: unknown, { email, password }: { email: string; password: string }) => {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) throw new Error("Email already in use");
      const hashed = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({ data: { email, password: hashed } });
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "7d" });
      return { token, email: user.email };
    },
    login: async (_: unknown, { email, password }: { email: string; password: string }) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new Error("Invalid credentials");
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new Error("Invalid credentials");
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "7d" });
      return { token, email: user.email };
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handler = startServerAndCreateNextHandler<NextRequest>(server as any, {
  context: async (req: NextRequest) => {
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "");
    if (!token) return {};
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
      return { userId: payload.userId };
    } catch {
      return {};
    }
  },
});

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}
