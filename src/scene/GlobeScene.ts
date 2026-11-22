import * as THREE from 'three'
import { createGlobe, type Globe } from './globe'
import { createStars, type Stars } from './stars'
import { activeRoute } from './store'

const ACCENT = new THREE.Color('#8fa2ff')

/** The route globe: dotted land, arcs from Geneva, a few stars. Renders only while on screen. */
export class GlobeScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(32, 1, 0.5, 2000)
  private globe: Globe | null = null
  private stars: Stars
  private presence = 0
  private focus = -1
  private shownFocus = -1
  private lastRoute = -1
  private visible = false
  private observer: IntersectionObserver
  private canvas: HTMLCanvasElement
  private target = new THREE.Vector3()

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.stars = createStars(1400)
    this.stars.update(1)
    this.scene.add(this.stars.points)
    this.observer = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting
      this.renderer.setAnimationLoop(this.visible ? this.frame : null)
    })
    this.observer.observe(canvas)
    window.addEventListener('resize', this.resize)
    this.resize()
  }

  async load(): Promise<void> {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = '/textures/earth-specular.jpg'
    })
    this.globe = createGlobe(img, ACCENT)
    this.scene.add(this.globe.group)
  }

  set(presence: number, focus: number): void {
    this.presence = presence
    this.focus = focus
  }

  private resize = () => {
    const r = this.canvas.getBoundingClientRect()
    this.renderer.setSize(r.width, r.height, false)
    this.camera.aspect = r.width / Math.max(1, r.height)
    this.camera.updateProjectionMatrix()
  }

  private frame = () => {
    const portrait = this.camera.aspect < 1
    const reach = portrait ? Math.min(2.2, 1.2 / this.camera.aspect) : 1
    // far enough back that the whole sphere sits inside the frame with air above and below
    const target = this.target.set(portrait ? 0 : -8.5, portrait ? 11 : 0, 0)
    this.camera.position.set(0, 2, 46).sub(target).multiplyScalar(reach).add(target)
    this.camera.lookAt(target)

    this.shownFocus += (this.focus - this.shownFocus) * 0.08
    this.globe?.update(this.presence, this.shownFocus)
    const route = Math.max(0, Math.round(this.shownFocus))
    if (route !== this.lastRoute) {
      this.lastRoute = route
      activeRoute.set(route)
    }
    this.renderer.render(this.scene, this.camera)
  }

  dispose(): void {
    this.renderer.setAnimationLoop(null)
    this.observer.disconnect()
    window.removeEventListener('resize', this.resize)
    this.renderer.dispose()
  }
}
