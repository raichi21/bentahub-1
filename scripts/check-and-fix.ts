import bcrypt from "bcryptjs"
import { db } from "../src/servers/db"
import { users } from "../src/servers/schemas"
import { eq } from "drizzle-orm"

async function main() {
  const email = "davebuemia211@gmail.com"
  const [user] = await db.select().from(users).where(eq(users.email, email))
  if (!user) {
    console.log("USER NOT FOUND in database")
    process.exit(1)
  }

  console.log("User found:", user.email, "| role:", user.role, "| verified:", user.isEmailVerified)

  // Check all possible passwords
  const attempts = ["davebuemia211", "davebuemia21", "davebuemai21"]
  for (const pw of attempts) {
    const ok = await bcrypt.compare(pw, user.password)
    console.log("Compare with '" + pw + "':", ok)
  }

  // Reset to what they last said: davebuemia21
  const newHash = await bcrypt.hash("davebuemia21", 10)
  await db.update(users).set({ password: newHash }).where(eq(users.email, email))
  console.log("Password reset to 'davebuemia21'")

  // Verify
  const check = await bcrypt.compare("davebuemia21", newHash)
  console.log("Verification:", check ? "PASSED" : "FAILED")

  process.exit(0)
}

main().catch((e) => {
  console.error("Error:", e)
  process.exit(1)
})
