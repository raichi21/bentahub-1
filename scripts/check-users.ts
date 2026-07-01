import fs from "fs"
import path from "path"

const envPath = path.resolve(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=")
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim()
        let val = trimmed.slice(eqIdx + 1).trim()
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1)
        }
        if (!process.env[key]) process.env[key] = val
      }
    }
  }
}

const [{ db }, { users }] = await Promise.all([
  import("../src/servers/db") as Promise<{ db: import("../src/servers/db").Database }>,
  import("../src/servers/schemas"),
])

const all = await db.query.users.findMany({
  columns: { email: true, fullName: true, role: true, branch: true, isEmailVerified: true },
})

console.log(JSON.stringify(all, null, 2))
