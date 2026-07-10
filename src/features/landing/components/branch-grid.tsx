"use client"

import Image from "next/image"
import { MapPin } from "lucide-react"

const branches = [
  {
    id: 1,
    name: "Lourdes Main Branch",
    location: "C. De Guzman St., Poblacion, Sta. Maria, Bulacan",
    manager: "Lourdes Gunio",
    stock: 92,
    image: "/images/landing/branch-1.png",
    open: true,
  },
  {
    id: 2,
    name: "Lourdes Second Branch",
    location: "C. De Guzman St., Poblacion, Sta. Maria, Bulacan",
    manager: "Lourdes Gunio",
    stock: 85,
    image: "/images/landing/branch-2.png",
    open: true,
  },
  {
    id: 3,
    name: "Lourdes Third Branch",
    location: "C. De Guzman St., Poblacion, Sta. Maria, Bulacan",
    manager: "Lourdes Gunio",
    stock: 78,
    image: "/images/landing/branch-3.png",
    open: true,
  },
]

export function BranchGrid() {
  return (
    <section id="branches" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Our Branches
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Find the BentaHub branch nearest to you.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all group flex flex-col"
            >
              {/* Image Container */}
              <div className="relative h-52 w-full overflow-hidden">
                <Image
                  src={branch.image}
                  alt={branch.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {branch.open && (
                  <span className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-medium px-2.5 py-1 rounded-full">
                    Open Now
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4" />
                  <span>{branch.location}</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  {branch.name}
                </h3>

                {/* Info Box */}
                <div className="bg-muted rounded-xl p-4 mb-6 text-sm flex justify-between items-center">
                  <div>
                    <p className="text-muted-foreground font-medium">Manager</p>
                    <p className="text-foreground font-semibold">{branch.manager}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground font-medium">Availability</p>
                    <p className="text-primary font-bold">{branch.stock}% Stock</p>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
