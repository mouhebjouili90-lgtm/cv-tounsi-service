import { describe, expect, it } from "vitest";
import {
  hashPassword,
  verifyPassword,
  generateUserToken,
  verifyUserToken,
  registerWithEmail,
  loginWithEmail,
} from "./auth-service";
import {
  createUserInDb,
  findUserByEmailInDb,
  saveUserCvInDb,
  getUserCvsFromDb,
  deleteUserCvFromDb,
} from "./db";

describe("User Authentication & Password Crypto", () => {
  it("hashes password with salt and verifies successfully", () => {
    const password = "SuperSecretPassword2026!";
    const hash = hashPassword(password);

    expect(hash).toContain(":");
    expect(verifyPassword(password, hash)).toBe(true);
    expect(verifyPassword("WrongPassword", hash)).toBe(false);
  });

  it("generates and verifies stateless HMAC JWT tokens", () => {
    const mockUser = {
      id: 42,
      email: "test.candidat@gmail.com",
      name: "Ahmed Tounsi",
      passwordHash: null,
      googleId: null,
      avatarUrl: null,
      role: "user",
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    const token = generateUserToken(mockUser);
    expect(token).toBeDefined();
    expect(token.split(".")).toHaveLength(2);

    const payload = verifyUserToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe(42);
    expect(payload?.email).toBe("test.candidat@gmail.com");
    expect(payload?.name).toBe("Ahmed Tounsi");

    // Tampered token should fail
    const tampered = token.slice(0, -5) + "abcde";
    expect(verifyUserToken(tampered)).toBeNull();
  });

  it("handles full registration and login flow", async () => {
    const uniqueEmail = `test.user.${Date.now()}@example.tn`;
    const password = "ValidPassword123";
    const name = "Yassine Mansour";

    // 1. Register
    const regResult = await registerWithEmail(uniqueEmail, password, name);
    expect(regResult.user).toBeDefined();
    expect(regResult.user.email).toBe(uniqueEmail);
    expect(regResult.user.name).toBe(name);
    expect(regResult.token).toBeDefined();

    // 2. Login with correct password
    const loginResult = await loginWithEmail(uniqueEmail, password);
    expect(loginResult.user.email).toBe(uniqueEmail);
    expect(loginResult.token).toBeDefined();

    // 3. Login with incorrect password should throw
    await expect(loginWithEmail(uniqueEmail, "IncorrectPass")).rejects.toThrow();
  });
});

describe("User Cloud CV Saving & Management", () => {
  it("saves, lists, and deletes CVs for a user", async () => {
    const testUserId = 8888;
    const cvTitle = "CV Ingénieur Logiciel Fullstack";
    const cvJson = JSON.stringify({ fullName: "Karim Ben Ali", targetRole: "Software Engineer" });

    // 1. Save new CV
    const savedCv = await saveUserCvInDb({
      userId: testUserId,
      title: cvTitle,
      dataJson: cvJson,
      template: "professional",
      language: "fr",
      isUnlocked: true,
    });

    expect(savedCv).toBeDefined();
    expect(savedCv.id).toBeDefined();
    expect(savedCv.userId).toBe(testUserId);
    expect(savedCv.title).toBe(cvTitle);

    // 2. Fetch user's CVs
    const cvList = await getUserCvsFromDb(testUserId);
    expect(cvList.length).toBeGreaterThanOrEqual(1);
    expect(cvList.some((c) => c.id === savedCv.id)).toBe(true);

    // 3. Delete CV
    const deleted = await deleteUserCvFromDb(testUserId, savedCv.id);
    expect(deleted).toBe(true);

    const updatedList = await getUserCvsFromDb(testUserId);
    expect(updatedList.some((c) => c.id === savedCv.id)).toBe(false);
  });
});
