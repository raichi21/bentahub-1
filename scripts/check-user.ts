import { db } from "../src/servers/db"
import { users } from "../src/servers/schemas"
import { eq } from "drizzle-orm"

async function main() {
  const targetEmail = "davebuemia211@gmail.com"

  const result = await db.select().from(users).where(eq(users.email, targetEmail))
  if (result.length === 0) {
    console.log("USER NOT FOUND")
  } else {
    const u = result[0]
    console.log("User found:", JSON.stringify({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      isEmailVerified: u.isEmailVerified,
      passwordHash: u.password.substring(0, 30) + "...",
    }, null, 2))
  }

  // List all users
  console.log("\n--- All users ---")
  const all = await db.select({ email: users.email, role: users.role, verified: users.isEmailVerified }).from(users)
  for (const u of all) {
    console.log(`  ${u.email} | role=${u.role} | verified=${u.verified}`)
  }

  process.exit(0)
}

main().catch((e) => {
  console.error("Error:", e)
  process.exit(1)
})
