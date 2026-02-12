import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, InsertCompany, InsertCompanyMember } from "@shared/schema";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email";
import { db } from "./db";
import { users, companies, companyMembers } from "@shared/schema";
import { eq } from "drizzle-orm";
// DISABLED: Auto enrichment on login removed to control Apify costs
// import { refreshCreatorProfileLight } from "./services/enrichment";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

declare module 'express-session' {
  interface SessionData {
    activeCompanyId?: number;
    googleAuthRole?: string;
    impersonation?: {
      originalUserId: number;
      impersonatedUserId: number;
      startedAt: string;
    };
    tiktokOAuthState?: {
      nonce: string;
      userId: number;
      timestamp: number;
      returnTo?: string;
    };
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

const sessionSettings: session.SessionOptions = {
  secret: process.env.REPLIT_CLUSTER || "local-secret",
  resave: false,
  saveUninitialized: false,
  store: storage.sessionStore,
};

export const sessionMiddleware = session(sessionSettings);

export function setupAuth(app: Express) {
  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());

  // Determine base URL for OAuth callbacks
  let baseUrl = 'http://localhost:5000';
  
  if (process.env.PRODUCTION_DOMAIN) {
    // Published app with custom domain
    baseUrl = `https://${process.env.PRODUCTION_DOMAIN}`;
  } else if (process.env.REPLIT_DEV_DOMAIN) {
    // Development environment on Replit
    baseUrl = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  } else if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    // Fallback: Published app on Replit
    baseUrl = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.app`;
  }

  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else if (!user.isVerified) {
        return done(null, false, { message: "Email not verified. Please check your inbox." });
      } else {
        return done(null, user);
      }
    }),
  );

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: `${baseUrl}/auth/google/callback`,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email from Google"), undefined);
          }

          let user = await storage.getUserByEmail(email);

          if (!user) {
            const avatar = profile.photos?.[0]?.value || null;
            const role = (req.session as any).googleAuthRole || "creator";
            const userName = profile.displayName || email.split('@')[0];
            
            user = await storage.createUser({
              email,
              name: userName,
              googleId: profile.id,
              avatar,
              password: null,
              role: role as "company" | "creator",
              isVerified: true,
              verificationToken: null,
            });

            // If the user is registering as a company via Google OAuth, create the company automatically
            if (role === "company") {
              // Use the user's name as company name since we don't have a companyName field in OAuth flow
              const companyName = userName || `Empresa ${user.id}`;
              
              // Generate a unique slug from company name
              let baseSlug = companyName
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // Remove accents
                .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with dashes
                .replace(/^-+|-+$/g, "") // Remove leading/trailing dashes
                .substring(0, 50);
              
              // Fallback slug if empty (e.g., non-latin characters)
              if (!baseSlug) {
                baseSlug = `empresa-${user.id}`;
              }
              
              // Check if slug exists and make it unique if needed
              let slug = baseSlug;
              let slugCounter = 1;
              while (await storage.getCompanyBySlug(slug)) {
                slug = `${baseSlug}-${slugCounter}`;
                slugCounter++;
              }

              // Create the company
              const companyData: InsertCompany = {
                name: companyName,
                slug: slug,
                createdByUserId: user.id,
                email: user.email,
                isDiscoverable: true,
                autoJoinCommunity: true,
              };

              const company = await storage.createCompany(companyData);
              console.log(`[Auth Google] Created company "${company.name}" (ID: ${company.id}) for user ${user.id}`);

              // Add the user as owner of the company
              const memberData: InsertCompanyMember = {
                companyId: company.id,
                userId: user.id,
                role: "owner",
              };

              await storage.addCompanyMember(memberData);
              console.log(`[Auth Google] Added user ${user.id} as owner of company ${company.id}`);
              // DISABLED: Auto enrichment removed to control costs - use on-demand only
            }
          } else if (!user.googleId) {
            await storage.updateUser(user.id, {
              googleId: profile.id,
              avatar: profile.photos?.[0]?.value || user.avatar,
            });
            user = await storage.getUser(user.id);
          } else {
            // User already exists with Google ID - check if role matches
            const requestedRole = (req.session as any).googleAuthRole || "creator";
            
            if (user.role !== requestedRole) {
              // User is trying to login with a different role than their existing account
              const roleLabels = { company: 'Empresa', creator: 'Criador' };
              console.log('[Google OAuth Strategy] Role mismatch:', {
                existingRole: user.role,
                requestedRole: requestedRole,
                email: user.email
              });
              delete (req.session as any).googleAuthRole;
              return done(null, false, { 
                message: `Esta conta já está cadastrada como ${roleLabels[user.role as keyof typeof roleLabels]}. Use o portal correto para entrar.` 
              });
            }
            
            // Reload from database to get latest data
            user = await storage.getUser(user.id);
            console.log('[Google OAuth Strategy] Reloaded user from DB:', {
              id: user?.id,
              email: user?.email,
              hasBio: !!user?.bio,
              bio: user?.bio
            });
          }

          delete (req.session as any).googleAuthRole;

          console.log('[Google OAuth Strategy] Final user before done():', {
            id: user?.id,
            email: user?.email,
            hasBio: !!user?.bio,
            bio: user?.bio
          });

          // DISABLED: Auto Apify enrichment on login removed to control costs
          // Profile refresh now only happens when user explicitly requests it

          return done(null, user!);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate company registration requires companyName
      if (req.body.role === "company") {
        const companyName = req.body.companyName?.trim();
        if (!companyName || companyName.length < 2) {
          return res.status(400).json({ message: "Nome da empresa é obrigatório (mínimo 2 caracteres)" });
        }
      }

      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser) {
        // Check if this is an orphaned company user (created but company creation failed)
        if (existingUser.role === "company" && req.body.role === "company") {
          const userCompanies = await storage.getUserCompanies(existingUser.id);
          if (userCompanies.length === 0) {
            // Orphaned user - delete and allow re-registration
            console.log(`[Auth] Cleaning up orphaned company user ${existingUser.id} (${existingUser.email})`);
            await storage.deleteUser(existingUser.id);
          } else {
            return res.status(400).send("Email already exists");
          }
        } else {
          return res.status(400).send("Email already exists");
        }
      }

      const hashedPassword = await hashPassword(req.body.password);
      const verificationToken = randomBytes(32).toString("hex");

      // Use transaction for company registration to avoid orphaned users
      if (req.body.role === "company") {
        const companyName = req.body.companyName?.trim() || req.body.name;

        // Generate a unique slug from company name
        let baseSlug = companyName
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // Remove accents
          .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with dashes
          .replace(/^-+|-+$/g, "") // Remove leading/trailing dashes
          .substring(0, 50);

        if (!baseSlug) {
          baseSlug = "empresa";
        }

        // Check if slug exists and make it unique if needed
        let slug = baseSlug;
        let slugCounter = 1;
        while (await storage.getCompanyBySlug(slug)) {
          slug = `${baseSlug}-${slugCounter}`;
          slugCounter++;
        }

        const result = await db.transaction(async (tx) => {
          // Create user inside transaction
          const [user] = await tx.insert(users).values({
            ...req.body,
            password: hashedPassword,
            verificationToken,
            isVerified: false,
          }).returning();

          // Create company inside same transaction
          const [company] = await tx.insert(companies).values({
            name: companyName,
            slug: slug,
            createdByUserId: user.id,
            email: user.email,
            isDiscoverable: true,
            autoJoinCommunity: true,
          } as InsertCompany).returning();

          // Add user as owner inside same transaction
          await tx.insert(companyMembers).values({
            companyId: company.id,
            userId: user.id,
            role: "owner",
          } as InsertCompanyMember);

          console.log(`[Auth] Created company "${company.name}" (ID: ${company.id}) for user ${user.id}`);
          return user;
        });

        await sendVerificationEmail(result.email, verificationToken);
        return res.status(201).json({ message: "Registration successful. Please verify your email." });
      }

      // Creator registration (no transaction needed - single insert)
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        verificationToken,
        isVerified: false,
      });

      await sendVerificationEmail(user.email, verificationToken);
      res.status(201).json({ message: "Registration successful. Please verify your email." });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.logIn(user, async (err) => {
        if (err) return next(err);
        
        // Set active company for company users
        let activeCompanyId: number | undefined;
        if (user.role === "company") {
          const memberships = await storage.getUserCompanies(user.id);
          if (memberships.length > 0) {
            activeCompanyId = memberships[0].companyId;
            req.session.activeCompanyId = activeCompanyId;
            await new Promise<void>((resolve, reject) => {
              req.session.save((err) => err ? reject(err) : resolve());
            });
          }
        }
        
        // DISABLED: Auto Apify enrichment on login removed to control costs
        // Profile refresh now only happens when user explicitly requests it
        
        // Include activeCompanyId in response so frontend has it immediately
        return res.status(200).json({ ...user, activeCompanyId });
      });
    })(req, res, next);
  });

  // Dev-only login (auto creates user/company if needed)
  app.post("/api/dev/login", async (req, res, next) => {
    if (process.env.NODE_ENV !== "development" || process.env.RENDER === "true") {
      return res.sendStatus(404);
    }

    try {
      const requestedRole = String(req.body?.role || req.query?.role || "company");
      const role = (requestedRole === "company" || requestedRole === "creator" || requestedRole === "admin")
        ? requestedRole
        : "company";

      const roleEmailEnv =
        role === "company"
          ? process.env.DEV_LOGIN_EMAIL_COMPANY
          : role === "creator"
            ? process.env.DEV_LOGIN_EMAIL_CREATOR
            : process.env.DEV_LOGIN_EMAIL_ADMIN;
      const email = (roleEmailEnv || process.env.DEV_LOGIN_EMAIL || `dev+${role}@creatorconnect.local`).trim();

      let user = await storage.getUserByEmail(email);

      if (user && user.role !== role) {
        return res.status(400).json({ message: "Usuário dev já existe com role diferente." });
      }

      if (!user) {
        const defaultName = role === "company" ? "Empresa Dev" : role === "admin" ? "Admin Dev" : "Criador Dev";
        user = await storage.createUser({
          email,
          name: process.env.DEV_LOGIN_NAME?.trim() || defaultName,
          password: null,
          googleId: null,
          avatar: null,
          role: role as "company" | "creator" | "admin",
          isVerified: true,
          verificationToken: null,
        });
      } else if (!user.isVerified) {
        user = await storage.updateUser(user.id, { isVerified: true, verificationToken: null });
      }

      let activeCompanyId: number | undefined;
      if (user.role === "company") {
        let memberships = await storage.getUserCompanies(user.id);
        if (memberships.length === 0) {
          const companyName = process.env.DEV_LOGIN_COMPANY_NAME?.trim() || "Empresa Dev";
          let baseSlug = companyName
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .substring(0, 50);

          if (!baseSlug) {
            baseSlug = `empresa-${user.id}`;
          }

          let slug = baseSlug;
          let slugCounter = 1;
          while (await storage.getCompanyBySlug(slug)) {
            slug = `${baseSlug}-${slugCounter}`;
            slugCounter++;
          }

          const companyData: InsertCompany = {
            name: companyName,
            slug,
            createdByUserId: user.id,
            email: user.email,
            isDiscoverable: true,
            autoJoinCommunity: true,
          };

          const company = await storage.createCompany(companyData);
          const memberData: InsertCompanyMember = {
            companyId: company.id,
            userId: user.id,
            role: "owner",
          };
          await storage.addCompanyMember(memberData);
          memberships = await storage.getUserCompanies(user.id);
        }

        if (memberships.length > 0) {
          activeCompanyId = memberships[0].companyId;
          req.session.activeCompanyId = activeCompanyId;
          await new Promise<void>((resolve, reject) => {
            req.session.save((err) => (err ? reject(err) : resolve()));
          });
        }
      }

      return req.logIn(user, async (err) => {
        if (err) return next(err);
        return res.status(200).json({ ...user, activeCompanyId });
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/logout", async (req, res) => {
    try {
      // Log if user was impersonating
      if (req.session?.impersonation) {
        console.log(`[Auth] Logging out during impersonation, original admin: ${req.session.impersonation.originalUserId}`);
      }
      
      // Promisified logout
      await new Promise<void>((resolve, reject) => {
        req.logout((err) => {
          if (err) {
            console.error('[Auth] Logout error:', err);
            // Continue with session destruction even if logout fails
          }
          resolve();
        });
      });
      
      // Always destroy session regardless of logout result
      await new Promise<void>((resolve) => {
        if (req.session) {
          req.session.destroy((err) => {
            if (err) {
              console.error('[Auth] Session destroy error:', err);
            }
            resolve();
          });
        } else {
          resolve();
        }
      });
      
      // Clear the session cookie
      res.clearCookie('connect.sid');
      res.sendStatus(200);
    } catch (error) {
      console.error('[Auth] Logout failed:', error);
      // Even on error, try to clear cookie and respond success
      res.clearCookie('connect.sid');
      res.sendStatus(200);
    }
  });

  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // For company users, ensure activeCompanyId is set (recover from session loss)
    if (req.user!.role === "company" && !req.session.activeCompanyId) {
      const memberships = await storage.getUserCompanies(req.user!.id);
      if (memberships.length > 0) {
        req.session.activeCompanyId = memberships[0].companyId;
        req.session.save(() => {});
      }
    }
    
    // Check if admin is impersonating another user
    if (req.session.impersonation) {
      const impersonatedUser = await storage.getUser(req.session.impersonation.impersonatedUserId);
      if (impersonatedUser) {
        return res.json({
          ...impersonatedUser,
          activeCompanyId: req.session.activeCompanyId,
          _isImpersonating: true,
          _originalAdminId: req.session.impersonation.originalUserId,
          _impersonationStartedAt: req.session.impersonation.startedAt
        });
      }
    }
    
    // Include activeCompanyId from session in user response
    res.json({
      ...req.user,
      activeCompanyId: req.session.activeCompanyId
    });
  });

  // Admin: Start impersonating a user
  app.post("/api/admin/impersonate/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Check admin access
    const email = req.user?.email || '';
    const isAdminByRole = req.user?.role === 'admin';
    const isAdminByEmail = email.endsWith('@turbopartners.com.br') || email === 'rodrigoqs9@gmail.com';

    if (!isAdminByRole && !isAdminByEmail) {
      return res.sendStatus(403);
    }

    // Prevent nested impersonation
    if (req.session.impersonation) {
      return res.status(400).json({ error: "Você já está em modo de impersonação. Saia primeiro." });
    }

    const targetUserId = parseInt(req.params.userId);
    const targetUser = await storage.getUser(targetUserId);
    
    if (!targetUser) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Prevent impersonating admins
    const targetEmail = targetUser.email || '';
    const isTargetAdminByRole = targetUser.role === 'admin';
    const isTargetAdminByEmail = targetEmail.endsWith('@turbopartners.com.br') || targetEmail === 'rodrigoqs9@gmail.com';
    
    if (isTargetAdminByRole || isTargetAdminByEmail) {
      return res.status(403).json({ error: "Não é possível impersonar administradores" });
    }

    // Store impersonation info in session
    req.session.impersonation = {
      originalUserId: req.user!.id,
      impersonatedUserId: targetUserId,
      startedAt: new Date().toISOString()
    };

    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => err ? reject(err) : resolve());
    });

    console.log(`[Admin] User ${req.user!.email} started impersonating user ${targetUser.email}`);
    
    res.json({ 
      message: `Você está agora visualizando como ${targetUser.name}`,
      impersonatedUser: targetUser
    });
  });

  // Admin: Stop impersonating
  app.post("/api/admin/impersonate/stop", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    if (!req.session.impersonation) {
      return res.status(400).json({ error: "Você não está em modo de impersonação" });
    }

    const impersonatedUserId = req.session.impersonation.impersonatedUserId;
    const impersonatedUser = await storage.getUser(impersonatedUserId);
    
    delete req.session.impersonation;

    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => err ? reject(err) : resolve());
    });

    console.log(`[Admin] User stopped impersonating ${impersonatedUser?.email || impersonatedUserId}`);
    
    res.json({ 
      message: "Você saiu do modo de impersonação",
      originalUser: req.user
    });
  });

  app.get("/auth/google", (req, res, next) => {
    const role = req.query.role as string;
    if (role === "company" || role === "creator") {
      (req.session as any).googleAuthRole = role;
    } else {
      (req.session as any).googleAuthRole = "creator";
    }
    passport.authenticate("google", { 
      scope: ["profile", "email"],
      prompt: "select_account"
    })(req, res, next);
  });

  app.get("/auth/google/callback",
    (req, res, next) => {
      passport.authenticate("google", (err: Error | null, user: SelectUser | false, info: { message?: string } | undefined) => {
        if (err) {
          console.error('[Google OAuth Callback] Error:', err);
          return res.redirect("/auth?error=google_error");
        }
        
        if (!user) {
          // Authentication failed - likely role mismatch
          const message = info?.message || "Falha na autenticação";
          console.log('[Google OAuth Callback] Auth failed:', message);
          return res.redirect(`/auth?error=role_mismatch&message=${encodeURIComponent(message)}`);
        }
        
        // Manually log in the user
        req.logIn(user, (loginErr) => {
          if (loginErr) {
            console.error('[Google OAuth Callback] Login error:', loginErr);
            return res.redirect("/auth?error=login_error");
          }
          next();
        });
      })(req, res, next);
    },
    async (req, res) => {
      const user = req.user as SelectUser;
      
      console.log('[Google OAuth Callback] User data:', {
        id: user.id,
        email: user.email,
        role: user.role,
        hasBio: !!user.bio,
        bio: user.bio
      });
      
      // Set active company for company users
      if (user.role === "company") {
        const memberships = await storage.getUserCompanies(user.id);
        if (memberships.length > 0) {
          req.session.activeCompanyId = memberships[0].companyId;
          await new Promise<void>((resolve, reject) => {
            req.session.save((err) => err ? reject(err) : resolve());
          });
          console.log('[Google OAuth Callback] Set activeCompanyId:', memberships[0].companyId);
        }
      }
      
      if (user.role === "creator" && !user.bio) {
        console.log('[Google OAuth Callback] Redirecting to onboarding (no bio)');
        res.redirect("/onboarding");
      } else if (user.role === "creator") {
        console.log('[Google OAuth Callback] Redirecting to feed (has bio)');
        res.redirect("/feed");
      } else {
        console.log('[Google OAuth Callback] Redirecting to dashboard (company)');
        res.redirect("/dashboard");
      }
    }
  );

  // Email Verification Endpoint
  app.get("/api/verify-email/:token", async (req, res) => {
    try {
      const token = req.params.token;
      const [user] = await db.select().from(users).where(eq(users.verificationToken, token));

      if (!user) {
        return res.redirect("/verify-result?status=error&message=Invalid token");
      }

      await storage.updateUser(user.id, {
        isVerified: true,
        verificationToken: null,
      });

      res.redirect(`/verify-result?status=success&role=${user.role}`);
    } catch (err) {
      console.error("Verification error:", err);
      res.redirect("/verify-result?status=error&message=Internal server error");
    }
  });

  // Resend Verification Email
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      if (user.isVerified) {
        return res.status(400).json({ message: "Email já verificado" });
      }

      const newToken = randomBytes(32).toString("hex");
      await storage.updateUser(user.id, { verificationToken: newToken });
      await sendVerificationEmail(user.email, newToken);

      res.json({ message: "Email de verificação reenviado com sucesso" });
    } catch (err) {
      console.error("Resend verification error:", err);
      res.status(500).json({ message: "Erro ao reenviar email" });
    }
  });

  // Forgot Password - Send Reset Email
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Security: same response whether user exists or not
        return res.json({ message: "Se o email existir, um link de recuperação foi enviado" });
      }

      const resetToken = randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

      await storage.updateUser(user.id, {
        resetToken,
        resetTokenExpiry,
      });

      console.log(`[Auth] Password reset token generated for user ${user.id} (${user.email})`);

      const emailSent = await sendPasswordResetEmail(user.email, resetToken);

      if (!emailSent) {
        console.error(`[Auth] Failed to send password reset email to ${user.email}`);
        // Clear token since email wasn't sent
        await storage.updateUser(user.id, {
          resetToken: null,
          resetTokenExpiry: null,
        });
        return res.status(500).json({ message: "Erro ao enviar email de recuperação. Tente novamente." });
      }

      console.log(`[Auth] Password reset email sent successfully to ${user.email}`);
      res.json({ message: "Se o email existir, um link de recuperação foi enviado" });
    } catch (err) {
      console.error("Forgot password error:", err);
      res.status(500).json({ message: "Erro ao processar solicitação" });
    }
  });

  // Reset Password - Update Password with Token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ message: "Token e senha são obrigatórios" });
      }

      const [user] = await db.select().from(users).where(eq(users.resetToken, token));

      if (!user) {
        return res.status(400).json({ message: "Token inválido ou expirado" });
      }

      if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
        return res.status(400).json({ message: "Token expirado" });
      }

      const hashedPassword = await hashPassword(password);
      await storage.updateUser(user.id, {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      });

      res.json({ message: "Senha redefinida com sucesso" });
    } catch (err) {
      console.error("Reset password error:", err);
      res.status(500).json({ message: "Erro ao redefinir senha" });
    }
  });
}
