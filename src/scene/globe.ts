import * as THREE from 'three'
import { DESTINATIONS, HOME, type Airport } from '../data/routes'

export const GLOBE_RADIUS = 9

function toVec(lat: number, lon: number, r = 1): THREE.Vector3 {
  const phi = THREE.MathUtils.degToRad(90 - lat)
  const theta = THREE.MathUtils.degToRad(lon + 180)
  return new THREE.Vector3(-Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)).multiplyScalar(r)
}

/** Orientation that brings direction `dir` to face the camera (+Z), north kept up, tilted to show it from slightly above. */
function facing(dir: THREE.Vector3): THREE.Quaternion {
  const yaw = -Math.atan2(dir.x, dir.z)
  const lat = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1))
  const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw)
  const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), lat - 0.32)
  return qPitch.multiply(qYaw)
}

const FADE_GLSL = /* glsl */ `
  float facingFade(vec3 worldPos, vec3 center) {
    vec3 n = normalize(worldPos - center);
    vec3 toCam = normalize(cameraPosition - worldPos);
    return smoothstep(-0.15, 0.35, dot(n, toCam));
  }`

function landDots(img: HTMLImageElement): THREE.Points {
  const w = 1024
  const h = 512
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h).data

  const N = 42000
  const golden = Math.PI * (3 - Math.sqrt(5))
  const pts: number[] = []
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const a = golden * i
    const v = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)
    const lat = 90 - THREE.MathUtils.radToDeg(Math.acos(v.y))
    // invert toVec: theta = atan2(z, -x)
    let lon = THREE.MathUtils.radToDeg(Math.atan2(v.z, -v.x)) - 180
    if (lon < -180) lon += 360
    const px = Math.min(w - 1, Math.floor(((lon + 180) / 360) * w))
    const py = Math.min(h - 1, Math.floor(((90 - lat) / 180) * h))
    // specular map: oceans are bright, land is dark
    if (data[(py * w + px) * 4] < 90) pts.push(v.x * GLOBE_RADIUS, v.y * GLOBE_RADIUS, v.z * GLOBE_RADIUS)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uOpacity: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uDpr: { value: Math.min(devicePixelRatio, 2) } },
    vertexShader: /* glsl */ `
      uniform vec3 uCenter;
      uniform float uDpr;
      varying float vFade;
      ${FADE_GLSL}
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vFade = facingFade(world.xyz, uCenter);
        vec4 mv = viewMatrix * world;
        gl_PointSize = uDpr * 52.0 / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying float vFade;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.25, d) * mix(0.1, 0.9, vFade) * uOpacity;
        gl_FragColor = vec4(vec3(0.83, 0.87, 0.93), a);
      }`,
  })
  return new THREE.Points(geo, mat)
}

function arcCurve(a: Airport, b: Airport): THREE.CatmullRomCurve3 {
  const va = toVec(a.lat, a.lon)
  const vb = toVec(b.lat, b.lon)
  const angle = va.angleTo(vb)
  const lift = 0.05 + 0.2 * (angle / Math.PI)
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= 64; i++) {
    const t = i / 64
    const v = va.clone().lerp(vb, t).normalize()
    // spherical interpolation keeps the arc on the great circle
    const q = new THREE.Quaternion().setFromUnitVectors(va, vb)
    const qt = new THREE.Quaternion().slerp(q, t)
    v.copy(va).applyQuaternion(qt)
    pts.push(v.multiplyScalar(GLOBE_RADIUS * (1 + Math.sin(Math.PI * t) * lift)))
  }
  return new THREE.CatmullRomCurve3(pts)
}

export interface Globe {
  group: THREE.Group
  update(presence: number, focus: number): void
}

export function createGlobe(img: HTMLImageElement, accent: THREE.Color): Globe {
  const group = new THREE.Group()
  const spin = new THREE.Group()
  group.add(spin)

  const dots = landDots(img)
  spin.add(dots)
  const dotMat = dots.material as THREE.ShaderMaterial

  // a dark body so arcs and dots on the far side are hidden by depth
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(GLOBE_RADIUS * 0.985, 64, 32),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#050a16'), transparent: true, opacity: 0 }),
  )
  spin.add(body)

  const arcMats: THREE.ShaderMaterial[] = []
  for (const dest of DESTINATIONS) {
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uProgress: { value: 0 },
        uActive: { value: 0 },
        uOpacity: { value: 0 },
        uAccent: { value: accent },
      },
      vertexShader: /* glsl */ `
        varying float vT;
        void main() {
          vT = uv.x;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uProgress;
        uniform float uActive;
        uniform float uOpacity;
        uniform vec3 uAccent;
        varying float vT;
        void main() {
          if (vT > uProgress) discard;
          float head = smoothstep(uProgress - 0.08, uProgress, vT) * uActive;
          vec3 base = mix(vec3(0.55, 0.6, 0.7), uAccent, uActive);
          vec3 c = mix(base, vec3(1.0), head * 0.6);
          gl_FragColor = vec4(c, mix(0.35, 1.0, uActive) * uOpacity);
          #include <colorspace_fragment>
        }`,
    })
    arcMats.push(mat)
    spin.add(new THREE.Mesh(new THREE.TubeGeometry(arcCurve(HOME, dest), 96, 0.032, 6, false), mat))

    const pin = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 12, 8),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#d4dbe6'), transparent: true, opacity: 0 }),
    )
    pin.position.copy(toVec(dest.lat, dest.lon, GLOBE_RADIUS * 1.002))
    spin.add(pin)
  }

  const home = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 16, 12),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0 }),
  )
  home.position.copy(toVec(HOME.lat, HOME.lon, GLOBE_RADIUS * 1.004))
  spin.add(home)

  const homeVec = toVec(HOME.lat, HOME.lon)
  const views = DESTINATIONS.map((d) => facing(homeVec.clone().add(toVec(d.lat, d.lon)).normalize()))
  const homeView = facing(homeVec)
  const q = new THREE.Quaternion()

  const fadeables: THREE.Material[] = []
  spin.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined
    if (m && 'opacity' in m && !(m instanceof THREE.ShaderMaterial)) fadeables.push(m)
  })

  return {
    group,
    update(presence, focus) {
      group.visible = presence > 0.005
      if (!group.visible) return
      group.scale.setScalar(0.82 + presence * 0.18)
      dotMat.uniforms.uOpacity.value = presence
      for (const m of fadeables) (m as THREE.MeshBasicMaterial).opacity = presence
      ;(body.material as THREE.MeshBasicMaterial).opacity = presence * 0.92

      const f = THREE.MathUtils.clamp(focus, -1, DESTINATIONS.length - 1)
      if (f < 0) q.copy(homeView).slerp(views[0], f + 1)
      else {
        const i = Math.floor(f)
        const j = Math.min(i + 1, views.length - 1)
        const t = THREE.MathUtils.smootherstep(f - i, 0, 1)
        q.copy(views[i]).slerp(views[j], t)
      }
      spin.quaternion.copy(q)

      arcMats.forEach((m, i) => {
        m.uniforms.uProgress.value = THREE.MathUtils.clamp((f - i + 1) * 1.15, 0, 1.0001)
        m.uniforms.uActive.value = Math.max(0, 1 - Math.abs(f - i) * 1.4)
        m.uniforms.uOpacity.value = presence
      })
    },
  }
}
