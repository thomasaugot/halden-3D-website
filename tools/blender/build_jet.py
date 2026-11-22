"""Build the Halden H7 business jet in Blender and export it as a GLB.

Run headless:
  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/build_jet.py -- public/models/h7.glb [preview.png]

Blender axes: nose on +X, span on Y, up on Z. The glTF exporter turns Z-up
into Y-up, so in three.js the nose stays on +X. Length is 30 units.
Object names are read by src/scene/jet.ts: Fuselage, Window and Int_* open
with the cabin cutaway, everything else never clips.
"""

import math
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "h7.glb"
PREVIEW = argv[1] if len(argv) > 1 else None

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------------------------------------------------------------- materials

MATS = {}


def mat(name, rgb, metallic=0.0, rough=0.5):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*rgb, 1)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = rough
    MATS[name] = m
    return m


def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


PAINT = mat("Paint", srgb("#f3f5f8"), 0.2, 0.3)
COBALT = mat("Cobalt", srgb("#2340c8"), 0.35, 0.32)
WING = mat("Wing", srgb("#d9dee5"), 0.45, 0.34)
METAL = mat("Metal", srgb("#aab3bd"), 0.9, 0.28)
GLASS = mat("Glass", srgb("#0b1220"), 0.3, 0.04)
DARK = mat("Dark", srgb("#12161f"), 0.0, 0.7)
LEATHER = mat("Leather", srgb("#e4ddd0"), 0.0, 0.62)
CARPET = mat("Carpet", srgb("#1b2234"), 0.0, 1.0)
WALNUT = mat("Walnut", srgb("#5a3f2e"), 0.05, 0.45)
TRIM = mat("Trim", srgb("#c9ccd1"), 0.85, 0.25)
LINEN = mat("Linen", srgb("#f1efea"), 0.0, 0.9)


def new_object(name, bm, material, smooth=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    me.materials.append(material)
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    return ob


def mirror_y(ob):
    mod = ob.modifiers.new("Mirror", "MIRROR")
    mod.use_axis = (False, True, False)
    mod.use_bisect_axis = (False, False, False)
    mod.use_clip = False
    return ob


# ---------------------------------------------------------------- fuselage

# (x, radius) stations, tail to nose
PROFILE = [
    (-15.0, 0.12), (-14.4, 0.42), (-13.2, 0.78), (-11.6, 1.08), (-9.6, 1.36),
    (-7.5, 1.54), (-5.0, 1.6), (6.5, 1.6), (8.4, 1.55), (10.0, 1.42),
    (11.4, 1.22), (12.6, 0.98), (13.6, 0.72), (14.4, 0.44), (14.85, 0.2), (15.0, 0.0),
]


def hermite(points, x):
    """Monotone-ish cubic through (x, y) points with finite-difference slopes."""
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    n = len(points)
    if x <= xs[0]:
        return ys[0]
    if x >= xs[-1]:
        return ys[-1]
    i = max(k for k in range(n - 1) if xs[k] <= x)
    x0, x1, y0, y1 = xs[i], xs[i + 1], ys[i], ys[i + 1]

    def slope(k):
        if k == 0:
            return (ys[1] - ys[0]) / (xs[1] - xs[0])
        if k == n - 1:
            return (ys[-1] - ys[-2]) / (xs[-1] - xs[-2])
        d0 = (ys[k] - ys[k - 1]) / (xs[k] - xs[k - 1])
        d1 = (ys[k + 1] - ys[k]) / (xs[k + 1] - xs[k])
        return 0.0 if d0 * d1 <= 0 else (d0 + d1) / 2

    h = x1 - x0
    t = (x - x0) / h
    m0, m1 = slope(i) * h, slope(i + 1) * h
    return (2 * t**3 - 3 * t**2 + 1) * y0 + (t**3 - 2 * t**2 + t) * m0 + (-2 * t**3 + 3 * t**2) * y1 + (t**3 - t**2) * m1


def radius(x):
    return max(hermite(PROFILE, x), 0.0)


def center_z(x):
    z = 0.0
    if x < -6:
        z += 0.95 * ((-6 - x) / 9) ** 1.6
    if x > 10:
        z -= 0.22 * ((x - 10) / 5) ** 1.5
    return z


WIDTH = 1.04  # cross-section is a touch wider than tall


def surface(x, theta, push=0.0):
    """Point and outward normal on the skin; theta 0 is the +Y side, pi/2 the crown."""
    r = radius(x)
    ry, rz = r * WIDTH, r
    p = Vector((x, (ry + push) * math.cos(theta), center_z(x) + (rz + push) * math.sin(theta)))
    dr = (radius(x + 0.05) - radius(x - 0.05)) / 0.1
    n = Vector((-dr, math.cos(theta) / ry, math.sin(theta) / rz)).normalized()
    return p, n


def build_fuselage():
    """Lofted skin with UVs for the livery: u runs tail (0) to nose (1); v runs
    around the section from the belly (0) up the port side (0.25) over the crown
    (0.5) and down the starboard side (0.75). The seam sits under the belly."""
    bm = bmesh.new()
    around = 96
    stations = 190
    rings = []
    meta = {}
    for i in range(stations):
        t = i / (stations - 1)
        x = -14.98 + 29.95 * (0.5 - 0.5 * math.cos(math.pi * t))
        r = radius(x)
        ring = []
        for j in range(around):
            a = -math.pi / 2 + 2 * math.pi * j / around
            v = bm.verts.new((x, r * WIDTH * math.cos(a), center_z(x) + r * math.sin(a)))
            meta[v] = ((x + 15.0) / 30.0, j)
            ring.append(v)
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for j in range(around):
            k = (j + 1) % around
            bm.faces.new((a[j], a[k], b[k], b[j]))
    tail = bm.verts.new((-15.04, 0, center_z(-15.0)))
    nose = bm.verts.new((15.0, 0, center_z(15.0)))
    meta[tail] = (0.0, None)
    meta[nose] = (1.0, None)
    for j in range(around):
        k = (j + 1) % around
        bm.faces.new((rings[0][k], rings[0][j], tail))
        bm.faces.new((rings[-1][j], rings[-1][k], nose))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    uv = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        js = [meta[l.vert][1] for l in f.loops if meta[l.vert][1] is not None]
        wrap = max(js) - min(js) > around // 2
        mid = sum(js) / len(js)
        for l in f.loops:
            u, j = meta[l.vert]
            if j is None:
                j = mid
            elif wrap and j < around // 2:
                j += around
            l[uv].uv = (u, j / around)
    return new_object("Fuselage", bm, PAINT)


def ellipsoid(bm, center, normal, size, seg=16):
    """Flattened ellipsoid whose thin axis follows `normal`; size = (along fuselage, height, thickness)."""
    q = normal.to_track_quat("Z", "X")
    m = Matrix.Translation(center) @ q.to_matrix().to_4x4() @ Matrix.Diagonal((*size, 1))
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=1.0, matrix=m)


def build_windows():
    bm = bmesh.new()
    for i in range(12):
        x = 8.0 - i * 1.4
        for side in (1, -1):
            theta = 0.2 if side == 1 else math.pi - 0.2
            p, n = surface(x, theta, push=0.005)
            ellipsoid(bm, p, n, (0.25, 0.33, 0.045))
    return new_object("Window", bm, GLASS)


def build_windshield():
    """Wraparound windshield: a skin-hugging patch with a centre post and two side posts."""
    bm = bmesh.new()
    x0, x1 = 12.55, 13.92
    nx, nt = 14, 90
    posts = (math.pi / 2, 0.98, math.pi - 0.98)
    post_w = 0.045

    def low(x):
        return 0.36 + 0.3 * (x - x0) / (x1 - x0)

    grid = []
    for i in range(nx + 1):
        x = x0 + (x1 - x0) * i / nx
        row = []
        for j in range(nt + 1):
            th = low(x) + (math.pi - 2 * low(x)) * j / nt
            p, _ = surface(x, th, push=0.012)
            row.append((bm.verts.new(p), th))
        grid.append(row)
    for i in range(nx):
        for j in range(nt):
            th = (grid[i][j][1] + grid[i][j + 1][1]) / 2
            if any(abs(th - c) < post_w for c in posts):
                continue
            bm.faces.new((grid[i][j][0], grid[i + 1][j][0], grid[i + 1][j + 1][0], grid[i][j + 1][0]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    loose = [v for v in bm.verts if not v.link_faces]
    bmesh.ops.delete(bm, geom=loose, context="VERTS")
    ob = new_object("Windshield", bm, GLASS)
    sol = ob.modifiers.new("Solidify", "SOLIDIFY")
    sol.thickness = 0.02
    return ob


# ---------------------------------------------------------------- lifting surfaces

def airfoil(n=28, camber=0.02):
    """NACA 4-digit style section: list of (u along chord 0..1, thickness factor, camber line)."""
    pts = []
    for i in range(n):
        beta = math.pi * i / (n - 1)
        u = 0.5 * (1 - math.cos(beta))
        yt = 5 * (0.2969 * math.sqrt(u) - 0.126 * u - 0.3516 * u**2 + 0.2843 * u**3 - 0.1036 * u**4)
        p = 0.4
        yc = camber / p**2 * (2 * p * u - u**2) if u < p else camber / (1 - p) ** 2 * (1 - 2 * p + 2 * p * u - u**2)
        pts.append((u, yt, yc))
    return pts


def section(le, chord, thick, axis, camber=0.02):
    """Ring of points: upper surface trailing edge to leading edge, then lower back to trailing edge."""
    af = airfoil(camber=camber)
    x_dir = Vector((-1, 0, 0))
    upper = [le + x_dir * (u * chord) + axis * ((yc + yt * thick) * chord) for u, yt, yc in reversed(af)]
    lower = [le + x_dir * (u * chord) + axis * ((yc - yt * thick) * chord) for u, yt, yc in af[1:-1]]
    return upper + lower


def loft(name, sections, material):
    bm = bmesh.new()
    rings = [[bm.verts.new(p) for p in s] for s in sections]
    n = len(rings[0])
    for a, b in zip(rings, rings[1:]):
        for j in range(n):
            k = (j + 1) % n
            bm.faces.new((a[j], a[k], b[k], b[j]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return new_object(name, bm, material)


SWEEP = math.tan(math.radians(33))
DIHEDRAL = 0.055
UP = Vector((0, 0, 1))
SIDE = Vector((0, 1, 0))


def wing_station(y, chord, thick, le_x=None):
    le_x = (2.2 - (y - 1.2) * SWEEP) if le_x is None else le_x
    z = -0.95 + (y - 1.2) * DIHEDRAL
    return section(Vector((le_x, y, z)), chord, thick, UP)


def build_wings():
    tip_y = 13.4
    secs = [
        wing_station(0.6, 7.0, 0.13, le_x=2.4),
        wing_station(1.2, 6.6, 0.13),
        wing_station(4.6, 3.9, 0.115),
        wing_station(9.0, 2.6, 0.1),
        wing_station(tip_y, 1.5, 0.09),
    ]
    wings = mirror_y(loft("Wing", secs, WING))

    tip_le = 2.2 - (tip_y - 1.2) * SWEEP
    tip_z = -0.95 + (tip_y - 1.2) * DIHEDRAL
    wl = []
    for k, (dy, dz, chord, dx) in enumerate(((-0.02, 0.0, 1.42, 0.0), (0.18, 0.45, 1.15, -0.45), (0.3, 1.25, 0.9, -1.05), (0.34, 2.05, 0.66, -1.6))):
        wl.append(section(Vector((tip_le + dx - 0.05, tip_y + dy, tip_z + dz)), chord, 0.09, SIDE, camber=0.0))
    # loft runs bottom to top, thickness across Y
    winglets = mirror_y(loft("Winglet", wl, COBALT))
    return wings, winglets


def build_tail():
    fin = loft("Fin", [
        section(Vector((-8.6, 0, 0.6)), 6.4, 0.11, SIDE, camber=0.0),
        section(Vector((-9.6, 0, 1.4)), 5.4, 0.11, SIDE, camber=0.0),
        section(Vector((-11.9, 0, 4.0)), 3.9, 0.1, SIDE, camber=0.0),
        section(Vector((-14.2, 0, 6.4)), 2.6, 0.09, SIDE, camber=0.0),
    ], COBALT)
    stab_sweep = math.tan(math.radians(34))
    stab = mirror_y(loft("Stabilizer", [
        section(Vector((-14.0, 0.0, 6.36)), 2.9, 0.1, UP, camber=0.0),
        section(Vector((-14.0 - 2.4 * stab_sweep, 2.4, 6.45)), 2.05, 0.09, UP, camber=0.0),
        section(Vector((-14.0 - 4.9 * stab_sweep, 4.9, 6.56)), 1.25, 0.08, UP, camber=0.0),
    ], PAINT))
    # bullet fairing where the stabiliser meets the fin
    bm = bmesh.new()
    ellipsoid(bm, Vector((-15.3, 0, 6.42)), Vector((0, 0, 1)), (1.8, 0.22, 0.22), seg=24)
    cap = new_object("FinCap", bm, COBALT)
    return fin, stab, cap


# ---------------------------------------------------------------- engines

def lathe_x(bm, profile, center, around=48):
    rings = []
    for x, r in profile:
        rings.append([bm.verts.new(center + Vector((x, r * math.cos(2 * math.pi * j / around), r * math.sin(2 * math.pi * j / around)))) for j in range(around)])
    for a, b in zip(rings, rings[1:]):
        for j in range(around):
            k = (j + 1) % around
            bm.faces.new((a[j], a[k], b[k], b[j]))
    return rings


def build_engines():
    c = Vector((-6.9, 2.6, 1.05))
    bm = bmesh.new()
    # outer skin runs forward to aft, x measured backwards from the intake
    outer = [(0.0, 0.66), (-0.12, 0.74), (-0.55, 0.8), (-2.3, 0.8), (-3.7, 0.7), (-4.5, 0.53), (-4.85, 0.46)]
    inner = [(-4.85, 0.46), (-4.6, 0.4), (-0.6, 0.6), (0.0, 0.66)]
    lathe_x(bm, outer + inner[1:], c)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    nacelle = mirror_y(new_object("Nacelle", bm, PAINT))

    bm = bmesh.new()
    bmesh.ops.create_circle(bm, cap_ends=True, radius=0.6, segments=48,
                            matrix=Matrix.Translation(c + Vector((-0.6, 0, 0))) @ Matrix.Rotation(math.pi / 2, 4, "Y"))
    bmesh.ops.create_circle(bm, cap_ends=True, radius=0.4, segments=48,
                            matrix=Matrix.Translation(c + Vector((-4.6, 0, 0))) @ Matrix.Rotation(math.pi / 2, 4, "Y"))
    fan = mirror_y(new_object("EngineFace", bm, DARK, smooth=False))

    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=32, radius1=0.2, radius2=0.0, depth=0.5,
                          matrix=Matrix.Translation(c + Vector((-0.45, 0, 0))) @ Matrix.Rotation(math.pi / 2, 4, "Y"))
    spinner = mirror_y(new_object("Spinner", bm, METAL))

    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=False, segments=48, radius1=0.7, radius2=0.7, depth=0.12,
                          matrix=Matrix.Translation(c + Vector((-0.05, 0, 0))) @ Matrix.Rotation(math.pi / 2, 4, "Y"))
    lip = mirror_y(new_object("IntakeLip", bm, TRIM))

    pylon = mirror_y(loft("Pylon", [
        section(Vector((-7.4, 1.0, 1.0)), 3.4, 0.12, UP, camber=0.0),
        section(Vector((-7.6, 2.1, 1.05)), 3.0, 0.11, UP, camber=0.0),
    ], PAINT))
    return nacelle, fan, spinner, lip, pylon


def build_fairing():
    bm = bmesh.new()
    ellipsoid(bm, Vector((-0.6, 0, -1.3)), Vector((0, 0, 1)), (6.6, 1.5, 0.6), seg=32)
    return new_object("Fairing", bm, PAINT)


# ---------------------------------------------------------------- cabin

FLOOR = -0.55


def box(bm, center, size):
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation(center) @ Matrix.Diagonal((*size, 1)))


def soft(ob, width=0.05):
    mod = ob.modifiers.new("Bevel", "BEVEL")
    mod.width = width
    mod.segments = 3
    mod.limit_method = "NONE"
    return ob


def seat(bm, x, y, back_dir):
    """back_dir +1 puts the backrest on the +X side (seat faces aft)."""
    box(bm, Vector((x, y, FLOOR + 0.36)), (0.74, 0.68, 0.24))
    box(bm, Vector((x + back_dir * 0.33, y, FLOOR + 0.78)), (0.16, 0.68, 0.72))
    for s in (-1, 1):
        box(bm, Vector((x + back_dir * 0.04, y + s * 0.37, FLOOR + 0.55)), (0.66, 0.1, 0.16))


def build_cabin():
    obs = []
    bm = bmesh.new()
    box(bm, Vector((0.4, 0, FLOOR - 0.03)), (17.8, 2.84, 0.06))
    obs.append(new_object("Int_Floor", bm, CARPET, smooth=False))

    bm = bmesh.new()
    for y in (0.74, -0.74):  # club suite, two facing pairs
        seat(bm, 7.7, y, +1)
        seat(bm, 5.6, y, -1)
    for x, d in ((2.55, +1), (-0.15, -1)):  # dining pair
        seat(bm, x, 0.62, d)
    box(bm, Vector((1.2, -1.12, FLOOR + 0.3)), (3.3, 0.62, 0.32))  # divan
    box(bm, Vector((1.2, -1.38, FLOOR + 0.72)), (3.3, 0.14, 0.62))
    obs.append(soft(new_object("Int_Seats", bm, LEATHER)))

    bm = bmesh.new()
    box(bm, Vector((1.2, 0.5, FLOOR + 0.74)), (1.7, 0.9, 0.05))  # dining table
    box(bm, Vector((6.65, 1.2, FLOOR + 0.62)), (1.2, 0.28, 0.05))  # club side ledges
    box(bm, Vector((6.65, -1.2, FLOOR + 0.62)), (1.2, 0.28, 0.05))
    for x in (3.85, -2.75):  # bulkheads with a central doorway
        for s in (1, -1):
            box(bm, Vector((x, s * 0.86, FLOOR + 0.65)), (0.08, 0.86, 1.3))
    box(bm, Vector((9.2, -0.82, FLOOR + 0.45)), (1.0, 0.9, 0.9))  # galley
    box(bm, Vector((-4.15, 0.15, FLOOR + 0.62)), (0.12, 1.6, 0.85))  # headboard
    box(bm, Vector((-4.45, 1.2, FLOOR + 0.3)), (0.5, 0.42, 0.6))  # nightstand
    box(bm, Vector((-7.1, 0.0, FLOOR + 0.65)), (0.6, 2.3, 1.3))  # wardrobe and lavatory wall
    obs.append(soft(new_object("Int_Walnut", bm, WALNUT), 0.02))

    bm = bmesh.new()
    box(bm, Vector((1.2, 0.5, FLOOR + 0.36)), (0.12, 0.12, 0.72))  # table pedestal
    box(bm, Vector((9.2, -0.82, FLOOR + 0.92)), (1.02, 0.92, 0.04))  # galley worktop
    obs.append(new_object("Int_Trim", bm, TRIM, smooth=False))

    bm = bmesh.new()
    box(bm, Vector((-5.4, 0.15, FLOOR + 0.24)), (2.2, 1.5, 0.42))  # bed
    for y in (0.5, -0.2):
        box(bm, Vector((-4.5, y, FLOOR + 0.52)), (0.32, 0.62, 0.14))  # pillows
    box(bm, Vector((-5.75, 0.15, FLOOR + 0.47)), (1.3, 1.54, 0.05))  # throw
    obs.append(soft(new_object("Int_Linen", bm, LINEN), 0.04))
    return obs


# ---------------------------------------------------------------- build

build_fuselage()
build_windows()
build_windshield()
build_wings()
build_tail()
build_engines()
build_fairing()
build_cabin()

bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    export_apply=True,
    export_yup=True,
    export_materials="EXPORT",
)
print(f"[h7] exported {OUT}")

if PREVIEW:
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 900
    world = bpy.data.worlds.new("World")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.75, 0.82, 0.9, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0
    scene.world = world
    sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", "SUN"))
    sun.data.energy = 4
    sun.rotation_euler = (math.radians(50), math.radians(10), math.radians(30))
    scene.collection.objects.link(sun)
    cam = bpy.data.objects.new("Cam", bpy.data.cameras.new("Cam"))
    cam.data.lens = 50
    scene.collection.objects.link(cam)
    scene.camera = cam
    shots = argv[2:] if len(argv) > 2 else ["front"]
    views = {
        "front": ((26, -22, 9), (0, 0, 0.5)),
        "side": ((0, -48, 1.5), (0, 0, 1.5)),
        "top": ((3, -14, 30), (0.5, 0, -0.5)),
        "cabin": ((2, -9, 22), (0.5, 0, -0.5)),
    }
    for shot in shots:
        loc, target = views[shot]
        for ob in scene.objects:
            if ob.name in ("Fuselage", "Window", "Windshield"):
                ob.hide_render = shot == "cabin"
        cam.location = loc
        cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = PREVIEW.replace(".png", f"-{shot}.png")
        bpy.ops.render.render(write_still=True)
        print(f"[h7] rendered {scene.render.filepath}")
