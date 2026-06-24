import { db } from "../src/servers/db"
import { users } from "../src/servers/schemas"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

async function main() {
  const targetEmail = "davebuemia211@gmail.com"

  const result = await db.select().from(users).where(eq(users.email, targetEmail))
  if (result.length === 0) {
    console.log("USER NOT FOUND")
    process.exit(1)
  }

  const u = result[0]
  console.log("Password hash:", u.password)

  // Try the password the user claims
  const password = "davebuemai21"
  const isValid = await bcrypt.compare(password, u.password)
  console.log(`Password "${password}" matches:`, isValid)

  // Also check the admin password
  const adminResult = await db.select().from(users).where(eq(users.email, "admin@bentahub.com"))
  if (adminResult.length > 0) {
    const adminPwValid = await bcrypt.compare("admin123", adminResult[0].password)
    console.log(`Admin password "admin123" matches:`, adminPwValid)
  }

  process.exit(0)
}

main().catch((e) => {
  console.error("Error:", e)
  process.exit(1)
})
