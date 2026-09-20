import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authRepository } from "../repositories/authRepository.js";
import { env } from "../config/env.js";

const SALT_ROUNDS = 10;

function buildPayload(user) {
  return {
    id: user.id.toString(),
    email: user.email,
    name: user.name,
  };
}

export const authService = {
  async login({ email, password }) {
    const user = await authRepository.findByEmail(email);

    if (!user) {
      return null;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return null;
    }

    const payload = buildPayload(user);
    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    return { token, user: payload };
  },

  async hashPassword(plain) {
    return bcrypt.hash(plain, SALT_ROUNDS);
  },
};
