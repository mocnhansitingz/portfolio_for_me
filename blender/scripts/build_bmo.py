# Rebuilds BMO (collection AT_BMO) and the controller cord in the room, then exports
# public/models/bmo.glb and room.glb. Run headless from the repo root, with Blender closed:
#   blender -b blender/portfolio-scene.blend --python blender/scripts/build_bmo.py
import bpy, bmesh, math, os, json
from mathutils import Matrix, Vector, Euler

def lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def mat(name, hexcol, rough=0.8):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    h = hexcol.lstrip('#')
    rgb = [lin(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)]
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    m.diffuse_color = (*rgb, 1)
    return m

def coll(name):
    c = bpy.data.collections.get(name)
    if c is None:
        c = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(c)
    for o in list(c.objects):
        d = o.data
        bpy.data.objects.remove(o)
        if d and d.users == 0 and isinstance(d, bpy.types.Mesh): bpy.data.meshes.remove(d)
    return c

class B:
    """Accumulates primitives into a single mesh with multiple materials."""
    def __init__(self):
        self.bm = bmesh.new()
        self.mats = []
    def _mi(self, m):
        if m not in self.mats:
            self.mats.append(m)
        return self.mats.index(m)
    def _merge(self, t, m, mtx, pick=None):
        if pick: t.normal_update()
        for f in t.faces:
            f.material_index = self._mi(pick(f) if pick else m)
            f.smooth = True
        bmesh.ops.transform(t, matrix=mtx, verts=t.verts)
        me = bpy.data.meshes.new("tmp")
        t.to_mesh(me); t.free()
        self.bm.from_mesh(me)
        bpy.data.meshes.remove(me)
    def box(self, size, loc, m, bevel=0.0, rot=(0, 0, 0), seg=3, pick=None):
        t = bmesh.new()
        bmesh.ops.create_cube(t, size=1)
        bmesh.ops.scale(t, vec=size, verts=t.verts)
        if bevel > 0:
            bmesh.ops.bevel(t, geom=t.edges[:], offset=bevel, segments=seg, profile=0.5, affect='EDGES')
        self._merge(t, m, Matrix.Translation(loc) @ Euler(rot).to_matrix().to_4x4(), pick)
    def cyl(self, r, depth, loc, m, axis='Z', seg=32, r2=None, rot=None):
        t = bmesh.new()
        bmesh.ops.create_cone(t, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=depth)
        R = Matrix.Identity(4)
        if axis == 'Y': R = Matrix.Rotation(math.radians(90), 4, 'X')
        if axis == 'X': R = Matrix.Rotation(math.radians(90), 4, 'Y')
        if rot is not None: R = rot
        self._merge(t, m, Matrix.Translation(loc) @ R)
    def sphere(self, r, loc, m, scale=(1, 1, 1), rot=(0, 0, 0), seg=(16, 10)):
        t = bmesh.new()
        bmesh.ops.create_uvsphere(t, u_segments=seg[0], v_segments=seg[1], radius=r)
        self._merge(t, m, Matrix.Translation(loc) @ Euler(rot).to_matrix().to_4x4() @ Matrix.Diagonal((*scale, 1)))
    def limb(self, p1, p2, r, m):
        p1, p2 = Vector(p1), Vector(p2)
        d = p2 - p1
        R = d.to_track_quat('Z', 'Y').to_matrix().to_4x4()
        self.cyl(r, d.length, (p1 + p2) / 2, m, seg=12, rot=R)
        self.sphere(r, p1, m, seg=(12, 8)); self.sphere(r, p2, m, seg=(12, 8))
    def chain(self, pts, r, m):
        for a, b in zip(pts, pts[1:]): self.limb(a, b, r, m)
    def tube(self, pts, r, m, res=12, ring=5):
        """Round tube swept along a smooth curve through pts (no joints, no inner caps)."""
        P = [Vector(p) for p in pts]
        cu = bpy.data.curves.new("tmp_tube", 'CURVE'); cu.dimensions = '3D'
        cu.bevel_depth = r; cu.bevel_resolution = ring; cu.resolution_u = res; cu.use_fill_caps = True
        sp = cu.splines.new('BEZIER'); sp.bezier_points.add(len(P) - 1)
        for i, bp in enumerate(sp.bezier_points):
            inner = 0 < i < len(P) - 1
            tan = (P[min(i + 1, len(P) - 1)] - P[max(i - 1, 0)]) / (6 if inner else 3)
            bp.handle_left_type = bp.handle_right_type = 'FREE'
            bp.co = P[i]; bp.handle_left = P[i] - tan; bp.handle_right = P[i] + tan
        ob = bpy.data.objects.new("tmp_tube", cu)
        bpy.context.scene.collection.objects.link(ob)
        bpy.context.view_layer.update()
        me = bpy.data.meshes.new_from_object(ob.evaluated_get(bpy.context.evaluated_depsgraph_get()))
        t = bmesh.new(); t.from_mesh(me)
        bpy.data.meshes.remove(me); bpy.data.objects.remove(ob); bpy.data.curves.remove(cu)
        self._merge(t, m, Matrix.Identity(4))
    def arc(self, r, w, a0, a1, loc, m, seg=16, depth=0.003):
        """Thin arc in the XZ plane, extruded along Y."""
        n = seg + 1
        ang = [math.radians(a0 + (a1 - a0) * i / seg) for i in range(n)]
        t = bmesh.new()
        def ring(rad, y): return [t.verts.new((rad * math.cos(a), y, rad * math.sin(a))) for a in ang]
        of, inf = ring(r + w / 2, -depth / 2), ring(r - w / 2, -depth / 2)
        ob, inb = ring(r + w / 2, depth / 2), ring(r - w / 2, depth / 2)
        for i in range(seg):
            t.faces.new((of[i], of[i + 1], inf[i + 1], inf[i]))
            t.faces.new((ob[i], inb[i], inb[i + 1], ob[i + 1]))
            t.faces.new((of[i], ob[i], ob[i + 1], of[i + 1]))
            t.faces.new((inf[i], inf[i + 1], inb[i + 1], inb[i]))
        t.faces.new((of[0], inf[0], inb[0], ob[0])); t.faces.new((of[-1], ob[-1], inb[-1], inf[-1]))
        bmesh.ops.recalc_face_normals(t, faces=t.faces)
        self._merge(t, m, Matrix.Translation(loc))
    def prism(self, pts, depth, loc, m, rot=(0, 0, 0)):
        """Convex polygon given in the XZ plane, extruded along Y."""
        t = bmesh.new()
        f = [t.verts.new((x, -depth / 2, z)) for x, z in pts]
        b = [t.verts.new((x, depth / 2, z)) for x, z in pts]
        t.faces.new(f); t.faces.new(b[::-1])
        n = len(pts)
        for i in range(n):
            j = (i + 1) % n
            t.faces.new((f[i], b[i], b[j], f[j]))
        bmesh.ops.recalc_face_normals(t, faces=t.faces)
        self._merge(t, m, Matrix.Translation(loc) @ Euler(rot).to_matrix().to_4x4())
    def text(self, body, size, extrude, mtx, m, offset=0.0):
        cu = bpy.data.curves.new("tmp_txt", 'FONT')
        cu.body = body; cu.size = size; cu.extrude = extrude; cu.offset = offset
        cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
        ob = bpy.data.objects.new("tmp_txt", cu)
        bpy.context.scene.collection.objects.link(ob)
        bpy.context.view_layer.update()
        me = bpy.data.meshes.new_from_object(ob.evaluated_get(bpy.context.evaluated_depsgraph_get()))
        t = bmesh.new(); t.from_mesh(me)
        dims = [max(v.co[i] for v in t.verts) - min(v.co[i] for v in t.verts) for i in range(3)]
        bpy.data.meshes.remove(me); bpy.data.objects.remove(ob); bpy.data.curves.remove(cu)
        self._merge(t, m, mtx)
        return dims
    def obj(self, name, collection, origin=(0, 0, 0)):
        o = Vector(origin)
        bmesh.ops.translate(self.bm, vec=-o, verts=self.bm.verts)
        me = bpy.data.meshes.new(name)
        self.bm.to_mesh(me); self.bm.free()
        for m in self.mats: me.materials.append(m)
        try: me.set_sharp_from_angle(angle=math.radians(40))
        except Exception: pass
        ob = bpy.data.objects.new(name, me)
        ob.location = o
        collection.objects.link(ob)
        return ob

def rrect(w, h, r, seg=5):
    pts = []
    for cx, cz, a0 in ((w / 2 - r, -(h / 2 - r), -90), (w / 2 - r, h / 2 - r, 0), (-(w / 2 - r), h / 2 - r, 90), (-(w / 2 - r), -(h / 2 - r), 180)):
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((cx + r * math.cos(a), cz + r * math.sin(a)))
    return pts

def ellipse(rx, rz, seg=20, cz=0.0):
    return [(rx * math.cos(2 * math.pi * i / seg), cz + rz * math.sin(2 * math.pi * i / seg)) for i in range(seg)]

# ================= BMO, modelled after the classic look =================
c = coll("AT_BMO")
W, D, H = 1.0, 0.64, 1.38
YF = -D / 2                                       # front face
front = mat("BMO_Teal", "#35CFBD"); side = mat("BMO_TealSide", "#1B7F95"); top = mat("BMO_TealTop", "#2BB0B4")
limb = mat("BMO_Limb", "#62CDC6"); screen = mat("BMO_ScreenGreen", "#C9F2DE", 0.4)
ink = mat("BMO_Ink", "#16201F"); slotd = mat("BMO_Slot", "#0E5E57"); tongue = mat("BMO_Tongue", "#5DB77A")
yellow = mat("BMO_Yellow", "#F9E04C"); cyan = mat("BMO_Cyan", "#7CCBEA"); green = mat("BMO_Green", "#4CB648")
red = mat("BMO_Red", "#F0306C"); blue = mat("BMO_Blue", "#3D5AA9"); dash = mat("BMO_Dash", "#2B3F9E")
d_pink = mat("Detail_DpadShade", "#F2A2A0"); d_blue = mat("Detail_TriShade", "#2F6FB5")
d_green = mat("Detail_GreenShade", "#2E7D32"); d_red = mat("Detail_RedShade", "#A3243B"); blush = mat("Detail_Blush", "#F4A0A8")

def body_pick(f):
    n = f.normal
    ax = max(range(3), key=lambda i: abs(n[i]))
    return side if ax == 0 else (front if ax == 1 else top)

b = B()
b.box((W, D, H), (0, 0, H / 2), front, bevel=0.06, seg=4, pick=body_pick)
b.box((0.5, 0.02, 0.042), (-0.11, YF - 0.002, 0.60), slotd)                      # cassette slot
# drop shadows painted behind the buttons, like the cartoon
b.prism(rrect(0.27, 0.09, 0.012), 0.004, (-0.222, YF - 0.002, 0.372), d_pink)
b.prism(rrect(0.09, 0.27, 0.012), 0.004, (-0.222, YF - 0.002, 0.372), d_pink)
b.prism(((-0.08, -0.055), (0.08, -0.055), (0, 0.085)), 0.004, (0.168, YF - 0.002, 0.398), d_blue)
b.prism(ellipse(0.05, 0.05), 0.004, (0.366, YF - 0.002, 0.32), d_green)
b.prism(ellipse(0.092, 0.092, 28), 0.004, (0.226, YF - 0.002, 0.176), d_red)
# speaker dots and the vertical "BMO" on the left side
for k in range(6):
    a = math.radians(60 * k + 20)
    b.cyl(0.023, 0.006, (-W / 2 - 0.001, 0.07 + 0.085 * math.cos(a), 1.13 + 0.085 * math.sin(a)), ink, 'X', seg=12)
txt = Matrix.Translation((-W / 2 - 0.001, -0.01, 0.56)) @ Matrix(((0, 0, -1, 0), (0, -1, 0, 0), (-1, 0, 0, 0), (0, 0, 0, 1)))
text_dims = b.text("BMO", 0.36, 0.004, txt, ink, offset=0.012)
# inked box edges between the front, top and side faces
ex, ey, ez, er = W / 2 - 0.0176, D / 2 - 0.0176, H - 0.0176, 0.008
corner = lambda sx: (sx * (W / 2 - 0.0254), -(D / 2 - 0.0254), H - 0.0254)
for sx in (-1, 1):
    b.chain([(sx * ex, -ey, 0.05), (sx * ex, -ey, H - 0.06), corner(sx), (sx * ex, -(D / 2 - 0.06), ez), (sx * ex, D / 2 - 0.06, ez)], er, ink)
b.chain([corner(-1), (-(W / 2 - 0.06), -ey, ez), (W / 2 - 0.06, -ey, ez), corner(1)], er, ink)
# legs stretched out on the table: smooth noodles ending in round feet
legs = (
    [(-0.19, -0.2, 0.068), (-0.2, -0.42, 0.07), (-0.215, -0.66, 0.056), (-0.25, -0.9, 0.046)],
    [(0.19, -0.2, 0.068), (0.215, -0.42, 0.07), (0.26, -0.66, 0.056), (0.33, -0.88, 0.046)],
)
for pts in legs:
    b.tube(pts, 0.038, limb)
    end = Vector(pts[-1]); d = (end - Vector(pts[-2])); d.z = 0; d.normalize()
    b.sphere(0.062, (end.x + d.x * 0.05, end.y + d.y * 0.05, 0.066), limb, scale=(1, 1.45, 1), rot=(0.28, 0, math.atan2(-d.x, d.y)), seg=(20, 12))
b.obj("BMO_Body", c)

# screen: rounded rectangle slightly proud of the front face
SZ = 1.0325   # screen centre; the screen is a little squat, like the cartoon
b = B(); b.prism(rrect(0.82, 0.555, 0.05), 0.04, (0, 0, 0), screen); b.obj("BMO_Screen", c).location = (0, YF - 0.005, SZ)
YS = YF - 0.0275                                  # just in front of the screen glass
for n, x in (("BMO_EyeL", -0.165), ("BMO_EyeR", 0.165)):
    b = B(); b.prism(ellipse(0.027, 0.04), 0.004, (0, 0, 0), ink); b.obj(n, c).location = (x, YS, SZ + 0.05)
    b = B(); b.arc(0.045, 0.016, 25, 155, (0, 0, -0.03), ink); b.obj(n.replace("Eye", "EyeHappy"), c).location = (x, YS, SZ + 0.05)
    b = B(); b.prism(ellipse(0.045, 0.024), 0.003, (0, 0, 0), blush); b.obj(n.replace("Eye", "Blush"), c).location = (x * 1.5, YS + 0.001, SZ - 0.035)
b = B(); b.arc(0.115, 0.015, 214, 326, (0, 0, 0), ink); b.obj("BMO_Mouth", c).location = (0, YS, SZ + 0.02)
b = B()
b.prism([(0.105 * math.cos(math.pi + math.pi * i / 16), 0.09 * math.sin(math.pi + math.pi * i / 16)) for i in range(17)], 0.004, (0, 0, 0), ink)
b.prism(ellipse(0.058, 0.026, 16, -0.054), 0.004, (0, -0.002, 0), tongue)
b.obj("BMO_MouthOpen", c).location = (0, YS, SZ - 0.035)
b = B(); b.prism(ellipse(0.032, 0.042), 0.004, (0, 0, 0), ink); b.obj("BMO_MouthO", c).location = (0, YS, SZ - 0.07)

# buttons, each its own object so it can be pressed
buttons = {}
def button(name, build, loc):
    bb = B(); build(bb); o = bb.obj(name, c); o.location = loc; buttons[name] = [round(v, 3) for v in loc]
def dpad(bb):
    bb.prism(rrect(0.27, 0.09, 0.012), 0.06, (0, 0, 0), yellow); bb.prism(rrect(0.09, 0.27, 0.012), 0.06, (0, 0, 0), yellow)
button("BMO_Btn_Dpad", dpad, (-0.2, YF, 0.39))
button("BMO_Btn_Triangle", lambda bb: bb.prism(((-0.08, -0.055), (0.08, -0.055), (0, 0.085)), 0.06, (0, 0, 0), cyan), (0.19, YF, 0.41))
button("BMO_Btn_Green", lambda bb: bb.cyl(0.048, 0.06, (0, 0, 0), green, 'Y', seg=24), (0.38, YF, 0.33))
button("BMO_Btn_Red", lambda bb: bb.cyl(0.09, 0.07, (0, 0, 0), red, 'Y', seg=32), (0.25, YF, 0.19))
button("BMO_Btn_Blue", lambda bb: bb.cyl(0.042, 0.05, (0, 0, 0), blue, 'Y', seg=24), (0.33, YF, 0.61))
button("BMO_Btn_Dash1", lambda bb: bb.prism(rrect(0.13, 0.038, 0.014, 3), 0.05, (0, 0, 0), dash), (-0.3, YF, 0.14))
button("BMO_Btn_Dash2", lambda bb: bb.prism(rrect(0.13, 0.038, 0.014, 3), 0.05, (0, 0, 0), dash), (-0.12, YF, 0.14))

# arms: thin noodles curving down from the sides, small four-fingered hands resting on the table.
# Origin at the shoulder so they can be raised.
for name, sx in (("BMO_ArmL", -1), ("BMO_ArmR", 1)):
    b = B()
    b.tube([(-sx * 0.04, 0, 0), (sx * 0.07, -0.02, -0.02), (sx * 0.14, -0.1, -0.15), (sx * 0.15, -0.24, -0.3), (sx * 0.13, -0.34, -0.37)], 0.03, limb)
    palm = Vector((sx * 0.125, -0.385, -0.375))
    b.sphere(0.05, palm, limb, scale=(1.1, 1.2, 0.75), seg=(20, 12))
    for ang in (-0.5, -0.17, 0.17, 0.5):
        b.sphere(0.02, (palm.x + math.sin(ang) * 0.068, palm.y - math.cos(ang) * 0.068, palm.z - 0.008), limb, scale=(1, 1.75, 0.9), rot=(0, 0, ang), seg=(12, 8))
    b.obj(name, c).location = (sx * W / 2, 0.0, 0.42)

# ================= re-route the controller cord behind BMO's back =================
props = bpy.data.objects["Props"]; pme = props.data
pb = B(); pb.bm.from_mesh(pme); pb.mats = list(pme.materials)
cord = bpy.data.materials["Cord"]; ci = pb.mats.index(cord)
bmesh.ops.delete(pb.bm, geom=[f for f in pb.bm.faces if f.material_index == ci], context='FACES')
kx, ky = 1.12, 0.38
pb.box((0.1, 0.034, 0.012), (kx - 0.1, ky, 0.056), cord); pb.box((0.034, 0.1, 0.012), (kx - 0.1, ky, 0.056), cord)
pb.chain([(kx, ky + 0.11, 0.02), (1.05, 0.68, 0.014), (0.8, 0.78, 0.014), (0.45, 0.66, 0.014), (0.2, 0.5, 0.03), (0.1, 0.43, 0.1)], 0.013, cord)
pb.bm.to_mesh(pme); pb.bm.free()
try: pme.set_sharp_from_angle(angle=math.radians(40))
except Exception: pass

# ================= export =================
# The .blend lives in <repo>/blender, so the repo root is two levels up from it.
proj = os.path.dirname(os.path.dirname(bpy.data.filepath))
out = os.path.join(proj, "public", "models")
sizes = {}
for cname, fname in (("AT_BMO", "bmo"), ("AT_Room", "room")):
    for o in bpy.context.view_layer.objects: o.select_set(False)
    objs = list(bpy.data.collections[cname].objects)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    path = os.path.join(out, fname + ".glb")
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_yup=True, export_cameras=False, export_lights=False, export_animations=False, export_texcoords=False, export_meshopt_compression_enable=True)
    sizes[fname] = os.path.getsize(path)
for o in bpy.context.view_layer.objects: o.select_set(False)
bpy.ops.wm.save_mainfile()
print("RESULT " + json.dumps({"sizes": sizes, "text_dims": [round(v, 3) for v in text_dims], "buttons": buttons, "objects": [o.name for o in c.objects], "face_y": YS}))
