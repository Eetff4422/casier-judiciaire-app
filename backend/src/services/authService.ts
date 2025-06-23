// backend/src/services/authService.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';

const prisma = new PrismaClient();

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  role: 'DEMANDEUR' | 'AGENT' | 'SUPERVISEUR' | 'ADMIN';
  securityQuestion: string;
  securityAnswer: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  
  // Hasher le mot de passe
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Vérifier le mot de passe
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Générer un token JWT
  static generateToken(userId: string, email: string, role: string): string {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET non défini dans .env');
    }

    const payload = { userId, email, role };
    const secret: Secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const options: SignOptions = {
      expiresIn: expiresIn as SignOptions['expiresIn']
    };

    return jwt.sign(payload, secret, options);
  }

  // Vérifier et décoder un token
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
      throw new Error('Token invalide');
    }
  }

  // Inscription d'un utilisateur
  static async register(data: RegisterData) {
    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà');
    }

    // Hasher le mot de passe et la réponse de sécurité
    const hashedPassword = await this.hashPassword(data.password);
    const hashedSecurityAnswer = await this.hashPassword(data.securityAnswer.toLowerCase());

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        fullName: data.fullName,
        role: data.role as any,
        securityQuestion: data.securityQuestion,
        securityAnswer: hashedSecurityAnswer
      }
    });

    // Générer le token
    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      token
    };
  }

  // Connexion d'un utilisateur
  static async login(data: LoginData) {
    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      throw new Error('Compte désactivé');
    }

    // Vérifier le mot de passe
    const isValidPassword = await this.verifyPassword(data.password, user.password);
    if (!isValidPassword) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Générer le token
    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      token
    };
  }
  // Trouver un utilisateur par email
  static async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email }
    });
  }
  // Récupération de compte par question de sécurité
  static async recoverAccount(email: string, securityAnswer: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('Aucun utilisateur trouvé avec cet email');
    }

    // Vérifier la réponse de sécurité
    const isValidAnswer = await this.verifyPassword(securityAnswer.toLowerCase(), user.securityAnswer);
    if (!isValidAnswer) {
      throw new Error('Réponse de sécurité incorrecte');
    }

    // Mettre à jour le mot de passe
    const hashedNewPassword = await this.hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword }
    });

    return { message: 'Mot de passe réinitialisé avec succès' };
  }

  // Obtenir les infos utilisateur par ID
  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      securityQuestion: user.securityQuestion,
      createdAt: user.createdAt
    };
  }
}