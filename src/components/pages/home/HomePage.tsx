import { HomeBooking } from '@/components/pages/home/HomeBooking'
import { HomeFilm } from '@/components/pages/home/HomeFilm'
import { HomeMembership } from '@/components/pages/home/HomeMembership'
import { HomeRoutes } from '@/components/pages/home/HomeRoutes'

export function HomePage() {
  return (
    <main>
      <HomeFilm />
      <HomeRoutes />
      <div id="descent">
        <HomeMembership />
        <HomeBooking />
      </div>
    </main>
  )
}
