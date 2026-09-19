"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CtaBanner() {
  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 rounded-3xl bg-primary p-8 md:flex-row md:p-12">
          <div className="text-center text-primary-foreground md:text-left">
            <h2 className="mb-2 text-3xl font-bold">
              Ready to start shopping?
            </h2>
            <p className="max-w-xl text-lg text-primary-foreground/80">
              Create an account today and experience the convenience of digital
              neighborhood shopping.
            </p>
          </div>
          <Button
            size="lg"
            asChild
            className="h-14 bg-white px-8 text-lg text-primary shadow-lg hover:bg-white/90"
          >
            <Link href="/register">Get Started</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
