# Adds the hidden snail (collection AT_Snail) and splits the hat off the shelf so it can
# swing, then exports public/models/room.glb and snail.glb. Run after build_bmo.py:
#   blender -b blender/portfolio-scene.blend --python blender/scripts/build_easter_eggs.py
import bpy, bmesh, math, os, json
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
# Reuse the helpers (mat, coll, B, ellipse, ...) from the BMO build script.
exec(open(os.path.join(HERE, "build_bmo.py"), encoding="utf-8").read().split("# ================= BMO")[0])

room = bpy.data.collections["AT_Room"]

# ================= hat: split it off the shelf so it can swing on its peg =================
shelf = bpy.data.objects["Shelf"]
sme = shelf.data
white_index = [i for i, m in enumerate(sme.materials) if m and m.name == "Paint_White"][0]
bm = bmesh.new(); bm.from_mesh(sme)
hat_faces = [f for f in bm.faces if f.material_index == white_index and f.calc_center_median().z < 0.7]
removed = len(hat_faces)
bmesh.ops.delete(bm, geom=hat_faces, context='FACES')
bm.to_mesh(sme); bm.free()

old = bpy.data.objects.get("Hat")
if old:
    d = old.data; bpy.data.objects.remove(old)
    if d.users == 0: bpy.data.meshes.remove(d)
white = mat("Paint_White", "#FFFDF3")
hx = 2.7
b = B()
b.sphere(0.27, (hx, 3.78, 0.22), white, scale=(1, 0.55, 1.1), seg=(24, 14))
for sx in (-1, 1):
    b.sphere(0.085, (hx + sx * 0.19, 3.78, 0.5), white)
b.obj("Hat", room, origin=(hx, 3.84, 0.5))

# ================= the waving snail =================
c = coll("AT_Snail")
skin = mat("Snail_Skin", "#B9D48A"); shell = mat("Snail_Shell", "#EFA53A"); spiral = mat("Detail_SnailSpiral", "#B5651D")
eye = mat("Snail_Eye", "#FFFFFF"); pupil = mat("Detail_SnailPupil", "#16201F")

# The snail is seen from the side: head towards +X, the camera looks at its -Y flank.
b = B()
b.sphere(0.035, (0.0, 0, 0.026), skin, scale=(3.0, 1.0, 0.75))                       # foot
b.tube([(0.05, 0, 0.03), (0.095, 0, 0.06), (0.115, 0, 0.105)], 0.024, skin, res=6, ring=3)   # neck
b.sphere(0.032, (0.118, 0, 0.112), skin)                                              # head
for sy in (-1, 1):
    b.tube([(0.118, sy * 0.012, 0.13), (0.12, sy * 0.02, 0.16), (0.125, sy * 0.024, 0.178)], 0.006, skin, res=4, ring=2)
    b.sphere(0.016, (0.126, sy * 0.025, 0.184), eye, seg=(12, 8))
    b.sphere(0.007, (0.13, sy * 0.025 - 0.012, 0.185), pupil, seg=(8, 6))
b.sphere(0.012, (0.143, -0.012, 0.104), pupil, scale=(0.5, 0.5, 0.35), seg=(8, 6))    # little smile dot
# shell with a spiral drawn on the side facing the camera
sc, sr, flat = Vector((-0.025, 0, 0.09)), 0.075, 0.55
b.sphere(sr, sc, shell, scale=(1, flat, 1), seg=(24, 14))
pts = []
turns, n = 2.3, 40
for i in range(n + 1):
    t = i / n
    r = 0.056 * (1 - t) + 0.006 * t
    a = math.radians(-60) + turns * 2 * math.pi * t
    y = -flat * math.sqrt(max(sr * sr - r * r, 0)) - 0.002
    pts.append((sc.x + r * math.cos(a), sc.y + y, sc.z + r * math.sin(a)))
b.tube(pts[::2], 0.0045, spiral, res=3, ring=2)
b.obj("Snail_Body", c)

# the waving arm, origin at the shoulder
b = B()
b.tube([(0, 0, 0), (0.006, -0.02, 0.03), (0.004, -0.03, 0.062)], 0.008, skin, res=5, ring=2)
b.sphere(0.014, (0.004, -0.031, 0.07), skin, seg=(12, 8))
b.obj("Snail_Arm", c).location = (0.085, -0.022, 0.07)

# ================= export =================
# The .blend lives in <repo>/blender, so the repo root is two levels up from it.
proj = os.path.dirname(os.path.dirname(bpy.data.filepath))
out = os.path.join(proj, "public", "models")
sizes = {}
for cname, fname in (("AT_Room", "room"), ("AT_Snail", "snail")):
    for o in bpy.context.view_layer.objects: o.select_set(False)
    objs = list(bpy.data.collections[cname].objects)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    path = os.path.join(out, fname + ".glb")
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_yup=True, export_cameras=False, export_lights=False, export_animations=False, export_texcoords=False, export_meshopt_compression_enable=True)
    sizes[fname] = os.path.getsize(path)
for o in bpy.context.view_layer.objects: o.select_set(False)
bpy.ops.wm.save_mainfile()
sword = bpy.data.objects["Sword"]
print("RESULT " + json.dumps({"sizes": sizes, "hat_faces_removed": removed, "sword": [round(v, 3) for v in sword.location], "room": [o.name for o in room.objects]}))
