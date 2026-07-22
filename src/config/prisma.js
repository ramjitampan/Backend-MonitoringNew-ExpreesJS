import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../generated/prisma/client.ts";
import { env } from "./env.js";

// BigInt otomatis ke string saat JSON.stringify
if (!BigInt.prototype.toJSON) {
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
}

const adapter = new PrismaMariaDb({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

prisma.$connect()
  .then(() => console.log("Database connected"))
  .catch((err) => console.error("Database connection failed:", err));

export default prisma;
