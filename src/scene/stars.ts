import * as THREE from 'three'

export interface Stars {
  points: THREE.Points
  update(night: number): void
}

export function createStars(count: number): Stars {
  const pos = new Float32Array(count * 3)
  const size = new Float32Array(count)
  let seed = 3
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < count; i++) {
    const u = rand() * 2 - 1
    const t = rand() * Math.PI * 2
    const r = Math.sqrt(1 - u * u)
    pos.set([r * Math.cos(t) * 800, Math.abs(u) * 800, r * Math.sin(t) * 800], i * 3)
    size[i] = 0.6 + rand() ** 3 * 2.2
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
  const uniforms = { uNight: { value: 0 }, uDpr: { value: Math.min(window.devicePixelRatio, 2) } }
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      attribute float aSize;
      uniform float uDpr;
      void main() {
        gl_PointSize = aSize * uDpr;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uNight;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        gl_FragColor = vec4(vec3(0.9, 0.93, 1.0), smoothstep(0.5, 0.1, d) * uNight * 0.85);
      }`,
  })
  const points = new THREE.Points(geo, mat)
  points.frustumCulled = false
  points.renderOrder = -9
  return {
    points,
    update(night) {
      uniforms.uNight.value = night
      points.visible = night > 0.01
    },
  }
}
