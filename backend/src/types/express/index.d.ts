// src/types/express/index.d.ts
import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
      role: Role;
    }

    interface Request {
      user?: User;
    }
  }
}
