import bcrypt from "bcryptjs"
import { db } from "../src/servers/db"
import { users } from "../src/servers/schemas"
import { eq } from "drizzle-orm"

async function main() {
  const email = "davebuemia211@gmail.com"
  const newPassword = "davebuemai21"

  const hashed = await bcrypt.hash(newPassword, 10)
  await db.update(users).set({ password: hashed }).where(eq(users.email, email))
  
  // Verify
  const [user] = await db.select().from(users).where(eq(users.email, email))
  const check = await bcrypt.compare(newPassword, user.password)
  console.log("Password updated:", check ? "PASSED" : "FAILED")
  
  process.exit(0)
}

main().catch((e) => {
  console.error("Error:", e)
  process.exit(1)
})
