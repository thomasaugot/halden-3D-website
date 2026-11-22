import { useEffect } from 'react'
import { ScrollTrigger } from './lib/gsap'
import { startLenis } from './lib/lenis'
import { Altimeter } from './components/Altimeter'
import { Loader } from './components/Loader'
import { Nav } from './components/Nav'
import { Film } from './sections/Film'
import { Routes } from './sections/Routes'
import { Membership } from './sections/Membership'
import { Book } from './sections/Book'
import { Footer } from './sections/Footer'
import { instrument } from './scene/store'

export default function App() {
  useEffect(() => {
    const stop = startLenis()
    // the descent: from cruise to the approach while the offer and the booking form scroll past
    const st = ScrollTrigger.create({
      trigger: '#descent',
      start: 'top 70%',
      end: 'bottom bottom',
      onUpdate: ({ progress: p }) => {
        instrument.set({ alt: 15500 - (15500 - 1500) * p, phase: 2 })
        document.documentElement.dataset.sky = 'night'
      },
    })
    return () => {
      st.kill()
      stop()
    }
  }, [])

  return (
    <>
      <Loader />
      <Nav />
      <Altimeter />
      <main>
        <Film />
        <Routes />
        <div id="descent">
          <Membership />
          <Book />
        </div>
      </main>
      <Footer />
    </>
  )
}
