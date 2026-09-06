"""Add two editable side pendants to the existing v3 crown without rewriting its meshes.

Requires numpy. Run with --base crown_source_refined_v3.glb --output crown_side_ornaments_v4.glb.
source_ornament_parts.npz contains selected, unmodified source mesh parts with their UVs.
The Cheonmachong reference guides the silhouette; this remains a composite visualization.
"""
from pathlib import Path
import argparse
import copy
import hashlib
import json
import math
import struct
import numpy as np

REF = 'https://sketchfab.com/3d-models/gold-crown-from-cheonmachong-tomb-d9b3c2ddf8464605a8dd9e9b0f2b5f3e'
A = np.array([[1., 0, 0], [0, 0, 1.], [0, -1., 0]])


def unit(v):
    return v / np.maximum(np.linalg.norm(v, axis=-1, keepdims=True), 1e-12)


def read_glb(path):
    raw = Path(path).read_bytes()
    assert struct.unpack_from('<4sII', raw) == (b'glTF', 2, len(raw))
    length = struct.unpack_from('<I', raw, 12)[0]
    doc = json.loads(raw[20:20 + length])
    binary = raw[28 + length:]
    return doc, binary


def accessor(doc, binary, i):
    d = doc['accessors'][i]
    v = doc['bufferViews'][d['bufferView']]
    dt = np.dtype({5126: '<f4', 5125: '<u4', 5123: '<u2', 5121: 'u1'}[d['componentType']])
    n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[d['type']]
    return np.ndarray((d['count'], n), dt, buffer=binary,
                      offset=v.get('byteOffset', 0) + d.get('byteOffset', 0),
                      strides=(v.get('byteStride', n * dt.itemsize), dt.itemsize)).copy()


def flattened(doc, binary):
    output = []
    def visit(i, parent):
        node = doc['nodes'][i]
        mat = np.array(node.get('matrix', np.eye(4).T.reshape(-1)), float).reshape(4, 4).T
        if 'translation' in node:
            mat[:3, 3] = node['translation']
        world = parent @ mat
        if 'mesh' in node:
            for p in doc['meshes'][node['mesh']]['primitives']:
                at = p['attributes']
                xyz = accessor(doc, binary, at['POSITION']) @ world[:3, :3].T + world[:3, 3]
                n = unit(accessor(doc, binary, at['NORMAL']) @ np.linalg.inv(world[:3, :3]))
                t = accessor(doc, binary, at['TANGENT'])
                t = np.column_stack((unit(t[:, :3] @ world[:3, :3].T) @ A, t[:, 3]))
                output.append((xyz @ A, n @ A, t,
                               accessor(doc, binary, at['TEXCOORD_0']),
                               accessor(doc, binary, p['indices']).reshape(-1, 3), p['material']))
        for child in node.get('children', []):
            visit(child, world)
    for i in doc['scenes'][doc.get('scene', 0)]['nodes']:
        visit(i, np.eye(4))
    return output


class AppendWriter:
    def __init__(self, doc, binary):
        self.doc = copy.deepcopy(doc)
        self.binary = bytearray(binary)

    def acc(self, values, kind):
        index = kind == 'SCALAR'
        arr = np.asarray(values, dtype='<u4' if index else '<f4')
        while len(self.binary) % 4:
            self.binary.append(0)
        offset = len(self.binary)
        self.binary.extend(arr.tobytes())
        views = self.doc['bufferViews']
        views.append({'buffer': 0, 'byteOffset': offset, 'byteLength': arr.nbytes,
                      'target': 34963 if index else 34962})
        acc = {'bufferView': len(views) - 1, 'componentType': 5125 if index else 5126,
               'count': len(arr), 'type': kind}
        if kind == 'VEC3':
            acc.update(min=arr.min(0).tolist(), max=arr.max(0).tolist())
        self.doc['accessors'].append(acc)
        return len(self.doc['accessors']) - 1

    def mesh(self, name, data):
        v, n, t, uv, f = data
        attrs = {'POSITION': self.acc(v @ A.T, 'VEC3'), 'NORMAL': self.acc(n @ A.T, 'VEC3'),
                 'TANGENT': self.acc(np.column_stack((t[:, :3] @ A.T, t[:, 3])), 'VEC4'),
                 'TEXCOORD_0': self.acc(uv, 'VEC2')}
        self.doc['meshes'].append({'name': name, 'primitives': [{'attributes': attrs,
            'indices': self.acc(f.reshape(-1), 'SCALAR'), 'material': 3}]})
        return len(self.doc['meshes']) - 1

    def node(self, name, mesh, parent, pos, angle=0):
        c, s = math.cos(angle), math.sin(angle)
        r = np.array([[c, -s, 0], [s, c, 0], [0, 0, 1.]])
        m = np.eye(4)
        m[:3, :3] = A @ r @ A.T
        m[:3, 3] = A @ np.array(pos)
        node = {'name': name, 'matrix': m.T.reshape(-1).tolist()}
        if mesh is not None:
            node['mesh'] = mesh
        else:
            node['children'] = []
        i = len(self.doc['nodes'])
        self.doc['nodes'].append(node)
        self.doc['nodes'][parent]['children'].append(i)
        return i


def shaped(part, dimensions=None, origin='center'):
    v, n, t, uv, f = [x.copy() for x in part]
    center = (v.min(0) + v.max(0)) / 2
    if origin == 'top':
        center[2] = v[:, 2].max()
    scale = np.ones(3) if dimensions is None else np.array(dimensions) / np.ptp(v, axis=0)
    v = (v - center) * scale
    n = unit(n / scale)
    tv = t[:, :3] * scale
    tv = unit(tv - n * np.sum(n * tv, axis=1, keepdims=True))
    return v, n, np.column_stack((tv, t[:, 3])), uv, f


def ring(radius, wire):
    vs, ns, uv, fs = [], [], [], []
    for i in range(28):
        a = math.tau * i / 28
        for j in range(8):
            b = math.tau * j / 8
            n = np.array([math.cos(a) * math.cos(b), math.sin(b), math.sin(a) * math.cos(b)])
            vs.append(np.array([radius * math.cos(a), 0, radius * math.sin(a)]) + wire * n)
            ns.append(n)
            uv.append([.224 + i / 28 * .004, .215 + j / 8 * .004])
            a0 = i * 8 + j
            b0 = i * 8 + (j + 1) % 8
            c0 = ((i + 1) % 28) * 8 + (j + 1) % 8
            d0 = ((i + 1) % 28) * 8 + j
            fs.extend([(a0, b0, c0), (a0, c0, d0)])
    n = np.asarray(ns)
    t = unit(np.cross(n, np.tile([0., 1, 0], (len(n), 1))))
    bad = np.linalg.norm(t, axis=1) < .5
    t[bad] = [1, 0, 0]
    return np.asarray(vs), n, np.column_stack((t, np.ones(len(t)))), np.asarray(uv), np.asarray(fs)


def build(base, parts_path, output):
    doc, binary = read_glb(base)
    assert doc['nodes'][0]['name'] == 'Crown_v3', 'Use the original v3 crown as the base.'
    writer = AppendWriter(doc, binary)
    stored = np.load(parts_path, allow_pickle=False)
    part = lambda name: tuple(stored[name + '_' + k] for k in ('v', 'n', 't', 'uv', 'f'))
    specs = {
        'chain': shaped(part('chain'), (.0033, .0031, .1475), 'top'),
        'bead': shaped(part('bead'), (.0088, .0088, .0054)),
        'small_leaf': shaped(part('small_leaf'), (.0043, .0009, .0064), 'top'),
        'tip': shaped(part('tip'), (.0089, .00065, .041), 'top'),
        'top_ring': ring(.0028, .0004), 'end_ring': ring(.0015, .0003),
    }
    ids = {name: writer.mesh('Side_pendant_' + name, data) for name, data in specs.items()}
    band = doc['meshes'][2]['primitives'][0]
    vertices = accessor(doc, binary, band['attributes']['POSITION']) @ A
    mounts = []
    for side, label in [(-1, 'Left'), (1, 'Right')]:
        target = np.array([side * .1, -.03, .025])
        anchor = vertices[np.argmin(np.linalg.norm(vertices - target, axis=1))].astype(float)
        normal = unit(np.array([anchor[0], anchor[1] - .014, 0.]))
        placement = anchor + normal * .0018
        group = writer.node(label + '_side_pendant', None, 0, placement, -side * math.radians(7))
        writer.doc['nodes'][group]['extras'] = {'reference': REF,
            'construction': 'Source gold chain and bead meshes; reference-guided leaf silhouette and placement',
            'measured_reconstruction': False, 'anchor_z_up_m': anchor.tolist()}
        writer.node(label + '_mount_ring', ids['top_ring'], group, [0, 0, -.001])
        writer.node(label + '_continuous_chain', ids['chain'], group, [0, 0, -.0035])
        for j in range(9):
            z = -.0105 - j * .0167
            writer.node(f'{label}_fluted_bead_{j + 1:02}', ids['bead'], group, [0, 0, z])
            for direction in [-1, 1]:
                writer.node(f'{label}_leaf_{j + 1:02}_{direction}', ids['small_leaf'], group,
                            [direction * .0038, -.0024, z - .0015], direction * math.radians(16))
        writer.node(label + '_terminal_ring', ids['end_ring'], group, [0, 0, -.150])
        writer.node(label + '_pointed_terminal_leaf', ids['tip'], group, [0, 0, -.151])
        mounts.append({'side': label, 'group_node': group, 'anchor_z_up_m': anchor.tolist(),
                       'length_m': .192, 'beads': 9, 'small_leaves': 18, 'terminal_leaves': 1})

    writer.doc['nodes'][0]['translation'] = [0, 0, 0]
    flat = flattened(writer.doc, writer.binary)
    lo = np.min([p[0].min(0) for p in flat], axis=0)
    hi = np.max([p[0].max(0) for p in flat], axis=0)
    writer.doc['nodes'][0]['translation'] = [0, float(-lo[2]), 0]
    writer.doc['nodes'][0]['name'] = 'Crown_v4_with_side_pendants'
    writer.doc['asset']['generator'] = 'Silla AR: v3 crown plus editable side pendants v4'
    writer.doc['extras']['side_pendants_v4'] = {'reference': REF,
        'reference_author': 'KOREA HERITAGE SERVICE [KHS]', 'reference_license': 'CC BY 4.0',
        'reference_mesh_downloaded': False, 'base_binary_preserved': True, 'mounts': mounts,
        'status': 'Geumgwanchong-source crown with Cheonmachong-inspired side ornaments; estimated visualization.'}
    writer.doc['buffers'][0]['byteLength'] = len(writer.binary)
    payload = json.dumps(writer.doc, ensure_ascii=False, separators=(',', ':')).encode()
    payload += b' ' * (-len(payload) % 4)
    data = bytes(writer.binary)
    data += b'\0' * (-len(data) % 4)
    result = struct.pack('<4sII', b'glTF', 2, 28 + len(payload) + len(data))
    result += struct.pack('<I4s', len(payload), b'JSON') + payload + struct.pack('<I4s', len(data), b'BIN\0') + data
    Path(output).write_bytes(result)
    assert data[:len(binary)] == binary
    assert writer.doc['materials'] == doc['materials']
    for mesh in writer.doc['meshes']:
        for p in mesh['primitives']:
            v = accessor(writer.doc, data, p['attributes']['POSITION'])
            n = accessor(writer.doc, data, p['attributes']['NORMAL'])
            indices = accessor(writer.doc, data, p['indices'])
            assert np.isfinite(v).all() and np.isfinite(n).all()
            assert np.max(np.abs(np.linalg.norm(n, axis=1) - 1)) < .002
            assert indices.max() < len(v)
    report = {'filename': Path(output).name, 'bytes': len(result),
        'sha256': hashlib.sha256(result).hexdigest(),
        'git_blob_sha': hashlib.sha1(b'blob ' + str(len(result)).encode() + b'\0' + result).hexdigest(),
        'base_binary_bytes_preserved': len(binary), 'base_materials_preserved': True,
        'side_groups': mounts, 'scene_triangles': sum(len(p[4]) for p in flat),
        'added_unique_meshes': len(specs), 'bounds_m': (hi - lo).tolist(),
        'checks': ['GLB header', 'finite positions and normals', 'normal lengths', 'index bounds', 'unchanged base binary and materials'],
        'ar_device_tested': False, 'reference': REF}
    Path(output).with_suffix('.validation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print(json.dumps(report, ensure_ascii=False, indent=2), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--base', required=True)
    parser.add_argument('--parts', default=str(Path(__file__).with_name('source_ornament_parts.npz')))
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    build(args.base, args.parts, args.output)
