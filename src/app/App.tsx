import { useEffect } from 'react'
import { Altimeter } from '@/components/layout/Altimeter'
import { Navbar } from '@/components/layout/Navbar'
import { PageLoader } from '@/components/layout/PageLoader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { HomePage } from '@/components/pages/home/HomePage'
import { startLenis } from '@/lib/lenis'
import { descentAltimeter } from '@/utils/animations/descent-altimeter'

export default function App() {
  useEffect(() => {
    const stop = startLenis()
    const stopDescent = descentAltimeter()
    return () => {
      stopDescent()
      stop()
    }
  }, [])

  return (
    <>
      <PageLoader />
      <Navbar />
      <Altimeter />
      <HomePage />
      <SiteFooter />
    </>
  )
}
