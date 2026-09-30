# -*- coding: utf-8 -*-
"""Génération d'un vbaProject.bin à partir de sources VBA, selon [MS-OVBA] et [MS-CFB].

Le projet est écrit sans cache de compilation (_VBA_PROJECT.Version = 0xFFFF,
MODULEOFFSET = 0), comme la spécification l'impose à un producteur tiers : Excel
recompile les modules à partir de leur source à l'ouverture.
"""
import struct
import uuid
import random

CODEPAGE = 1252
ENC = "cp1252"

# ---------------------------------------------------------------- MS-OVBA 2.4.1 compression


def _compress_chunk(chunk: bytes) -> bytes:
    n = len(chunk)
    out = bytearray()
    index = {}  # 3-grammes -> positions
    i = 0

    def add(pos):
        if pos + 3 <= n:
            index.setdefault(chunk[pos:pos + 3], []).append(pos)

    while i < n:
        flag_pos = len(out)
        out.append(0)
        flag = 0
        for bit in range(8):
            if i >= n:
                break
            best_len, best_off = 0, 0
            if i > 0:
                bit_count = max((i - 1).bit_length(), 4)
                max_len = (0xFFFF >> bit_count) + 3
                cands = index.get(chunk[i:i + 3], [])
                for p in reversed(cands[-256:]):
                    off = i - p
                    l = 0
                    lim = min(max_len, n - i)
                    while l < lim and chunk[p + l] == chunk[i + l]:
                        l += 1
                    if l > best_len:
                        best_len, best_off = l, off
                        if l == lim:
                            break
            if best_len >= 3:
                bit_count = max((i - 1).bit_length(), 4)
                token = ((best_off - 1) << (16 - bit_count)) | (best_len - 3)
                out += struct.pack("<H", token)
                flag |= 1 << bit
                for k in range(best_len):
                    add(i + k)
                i += best_len
            else:
                out.append(chunk[i])
                add(i)
                i += 1
        out[flag_pos] = flag
    if len(out) > 4096 and n == 4096:
        # bloc non compressible : copie brute de 4096 octets
        return struct.pack("<H", 0x3000 | 4095) + chunk
    header = 0x8000 | 0x3000 | ((len(out) + 2 - 3) & 0x0FFF)
    return struct.pack("<H", header) + bytes(out)


def compress(data: bytes) -> bytes:
    res = bytearray([0x01])
    for p in range(0, len(data), 4096):
        res += _compress_chunk(data[p:p + 4096])
    if not data:
        res += struct.pack("<H", 0x8000 | 0x3000 | 0)  # bloc vide (taille 3 - 3)
        res += b"\x00"
    return bytes(res)


def decompress(data: bytes) -> bytes:
    """Décompression de contrôle (implémentation indépendante)."""
    assert data[0] == 1
    pos = 1
    out = bytearray()
    while pos < len(data):
        header = struct.unpack_from("<H", data, pos)[0]
        size = (header & 0x0FFF) + 3
        compressed = header & 0x8000
        chunk_end = pos + size
        pos += 2
        start = len(out)
        if not compressed:
            out += data[pos:pos + 4096]
            pos += 4096
            continue
        while pos < chunk_end:
            flag = data[pos]
            pos += 1
            for bit in range(8):
                if pos >= chunk_end:
                    break
                if flag & (1 << bit):
                    token = struct.unpack_from("<H", data, pos)[0]
                    pos += 2
                    diff = len(out) - start
                    bit_count = max((diff - 1).bit_length(), 4)
                    length = (token & (0xFFFF >> bit_count)) + 3
                    offset = (token >> (16 - bit_count)) + 1
                    for _ in range(length):
                        out.append(out[-offset])
                else:
                    out.append(data[pos])
                    pos += 1
    return bytes(out)


# ---------------------------------------------------------------- MS-OVBA 2.4.3 chiffrement


def _encrypt(project_id: str, data: bytes) -> str:
    seed = random.randint(0, 255)
    version = 2
    proj_key = sum(project_id.encode(ENC)) & 0xFF
    out = bytearray([seed, seed ^ version, seed ^ proj_key])
    unenc1 = proj_key
    enc1 = seed ^ proj_key
    enc2 = seed ^ version
    ignored = (seed & 6) // 2
    for _ in range(ignored):
        temp = random.randint(0, 255)
        b = temp ^ ((enc2 + unenc1) & 0xFF)
        out.append(b)
        enc2, enc1, unenc1 = enc1, b, temp
    for byte in struct.pack("<I", len(data)) + data:
        b = byte ^ ((enc2 + unenc1) & 0xFF)
        out.append(b)
        enc2, enc1, unenc1 = enc1, b, byte
    return out.hex().upper()


# ---------------------------------------------------------------- flux dir


def _rec(rid: int, payload: bytes) -> bytes:
    return struct.pack("<HI", rid, len(payload)) + payload


def _dir_stream(modules, project_name="VBAProject"):
    d = bytearray()
    d += _rec(0x0001, struct.pack("<I", 0x00000001))        # SYSKIND Win32
    d += _rec(0x0002, struct.pack("<I", 0x00000409))        # LCID (MS-OVBA : MUST be 0x409)
    d += _rec(0x0014, struct.pack("<I", 0x00000409))        # LCIDINVOKE
    d += _rec(0x0003, struct.pack("<H", CODEPAGE))          # CODEPAGE
    d += _rec(0x0004, project_name.encode(ENC))              # NAME
    d += _rec(0x0005, b"") + _rec(0x0040, b"")               # DOCSTRING
    d += _rec(0x0006, b"") + _rec(0x003D, b"")               # HELPFILEPATH
    d += _rec(0x0007, struct.pack("<I", 0))                 # HELPCONTEXT
    d += _rec(0x0008, struct.pack("<I", 0))                 # LIBFLAGS
    d += struct.pack("<HIIH", 0x0009, 4, 1, 0)               # VERSION
    d += _rec(0x000C, b"") + _rec(0x003C, b"")               # CONSTANTS
    # Référence OLE Automation (stdole)
    ref = "stdole"
    d += _rec(0x0016, ref.encode(ENC)) + _rec(0x003E, ref.encode("utf-16-le"))
    libid = ("*\\G{00020430-0000-0000-C000-000000000046}#2.0#0#"
             "C:\\Windows\\System32\\stdole2.tlb#OLE Automation").encode(ENC)
    body = struct.pack("<I", len(libid)) + libid + struct.pack("<IH", 0, 0)
    d += _rec(0x000D, body)
    # Modules
    d += _rec(0x000F, struct.pack("<H", len(modules)))
    d += _rec(0x0013, struct.pack("<H", 0xFFFF))
    for m in modules:
        name = m["name"]
        d += _rec(0x0019, name.encode(ENC))
        d += _rec(0x0047, name.encode("utf-16-le"))
        d += _rec(0x001A, name.encode(ENC)) + _rec(0x0032, name.encode("utf-16-le"))
        d += _rec(0x001C, b"") + _rec(0x0048, b"")
        d += _rec(0x0031, struct.pack("<I", 0))
        d += _rec(0x001E, struct.pack("<I", 0))
        d += _rec(0x002C, struct.pack("<H", 0xFFFF))
        d += _rec(0x0022 if m["type"] in ("document", "class") else 0x0021, b"")
        d += _rec(0x002B, b"")
    d += struct.pack("<HI", 0x0010, 0)
    return bytes(d)


def _project_stream(modules, project_id):
    lines = [f'ID="{project_id}"']
    for m in modules:
        if m["type"] == "document":
            lines.append(f"Document={m['name']}/&H00000000")
        elif m["type"] == "class":
            lines.append(f"Class={m['name']}")
        else:
            lines.append(f"Module={m['name']}")
    lines += [
        'Name="VBAProject"',
        'HelpContextID="0"',
        'VersionCompatible32="393222000"',
        f'CMG="{_encrypt(project_id, struct.pack("<I", 0))}"',
        f'DPB="{_encrypt(project_id, bytes([0]))}"',
        f'GC="{_encrypt(project_id, bytes([0xFF]))}"',
        "",
        "[Host Extender Info]",
        "&H00000001={3832D640-CF90-11CF-8E43-00A0C911005A};VBE;&H00000000",
        "",
        "[Workspace]",
    ]
    for m in modules:
        lines.append(f"{m['name']}=0, 0, 0, 0, C")
    return ("\r\n".join(lines) + "\r\n").encode(ENC)


def _projectwm(modules):
    b = bytearray()
    for m in modules:
        b += m["name"].encode(ENC) + b"\x00"
        b += m["name"].encode("utf-16-le") + b"\x00\x00"
    b += b"\x00\x00"
    return bytes(b)


DOC_HEADER = {
    "workbook": '0{00020819-0000-0000-C000-000000000046}',
    "worksheet": '0{00020820-0000-0000-C000-000000000046}',
}


def module_source(m):
    name = m["name"]
    head = [f'Attribute VB_Name = "{name}"']
    if m["type"] == "document":
        head += [
            f'Attribute VB_Base = "{DOC_HEADER[m.get("base", "worksheet")]}"',
            "Attribute VB_GlobalNameSpace = False",
            "Attribute VB_Creatable = False",
            "Attribute VB_PredeclaredId = True",
            "Attribute VB_Exposed = True",
            "Attribute VB_TemplateDerived = False",
            "Attribute VB_Customizable = True",
        ]
    code = m.get("code", "").replace("\r\n", "\n").replace("\n", "\r\n")
    text = "\r\n".join(head) + "\r\n" + code
    if not text.endswith("\r\n"):
        text += "\r\n"
    return text.encode(ENC)


# ---------------------------------------------------------------- MS-CFB (version 3)

SECT = 512
MINI = 64
CUTOFF = 4096
FREESECT, ENDOFCHAIN, FATSECT, NOSTREAM = 0xFFFFFFFF, 0xFFFFFFFE, 0xFFFFFFFD, 0xFFFFFFFF


class _Node:
    def __init__(self, name, kind, data=None):
        self.name, self.kind, self.data = name, kind, data
        self.children = []
        self.left = self.right = self.child = NOSTREAM
        self.start, self.size = ENDOFCHAIN, 0
        self.sid = None


def _key(n):
    return (len(n.name), n.name.upper())


def write_cfb(tree):
    """tree : {'PROJECT': bytes, 'VBA': {'dir': bytes, ...}}"""
    root = _Node("Root Entry", 5)

    def build(parent, d):
        for name, val in d.items():
            if isinstance(val, dict):
                n = _Node(name, 1)
                build(n, val)
            else:
                n = _Node(name, 2, val)
            parent.children.append(n)

    build(root, tree)
    nodes = []

    def number(n):
        n.sid = len(nodes)
        nodes.append(n)
        for c in sorted(n.children, key=_key):
            number(c)

    number(root)
    # Arbre des frères : chaîne triée (tous noirs), acceptée par les lecteurs.
    for n in nodes:
        kids = sorted(n.children, key=_key)
        if kids:
            n.child = kids[0].sid
            for a, b in zip(kids, kids[1:]):
                a.right = b.sid

    streams = [n for n in nodes if n.kind == 2]
    mini = [s for s in streams if len(s.data) < CUTOFF]
    big = [s for s in streams if len(s.data) >= CUTOFF]

    # mini-flux
    ministream = bytearray()
    minifat = []
    for s in mini:
        s.size = len(s.data)
        if s.size == 0:
            s.start = ENDOFCHAIN
            continue
        cnt = -(-s.size // MINI)
        s.start = len(ministream) // MINI
        for k in range(cnt):
            minifat.append(s.start + k + 1 if k < cnt - 1 else ENDOFCHAIN)
        ministream += s.data + b"\x00" * (cnt * MINI - s.size)

    def nsect(nbytes):
        return -(-nbytes // SECT)

    n_dir = nsect(len(nodes) * 128)
    n_minifat = nsect(len(minifat) * 4)
    n_mstream = nsect(len(ministream))
    n_big = sum(nsect(len(s.data)) for s in big)
    n_fat = 1
    while True:
        total = n_fat + n_dir + n_minifat + n_mstream + n_big
        if n_fat * (SECT // 4) >= total:
            break
        n_fat += 1
    assert n_fat <= 109

    fat = []
    sectors = []

    def alloc(data, count):
        start = len(fat)
        for k in range(count):
            fat.append(start + k + 1 if k < count - 1 else ENDOFCHAIN)
        buf = bytes(data) + b"\x00" * (count * SECT - len(data))
        for k in range(count):
            sectors.append(buf[k * SECT:(k + 1) * SECT])
        return start

    fat_start = len(fat)
    for _ in range(n_fat):
        fat.append(FATSECT)
        sectors.append(None)
    # répertoire (rempli après)
    dir_start = len(fat)
    for k in range(n_dir):
        fat.append(dir_start + k + 1 if k < n_dir - 1 else ENDOFCHAIN)
        sectors.append(None)
    minifat_start = ENDOFCHAIN
    if minifat:
        mf = b"".join(struct.pack("<I", v) for v in minifat)
        mf += struct.pack("<I", FREESECT) * ((n_minifat * SECT - len(mf)) // 4)
        minifat_start = alloc(mf, n_minifat)
    root.start = ENDOFCHAIN
    root.size = len(ministream)
    if ministream:
        root.start = alloc(ministream, n_mstream)
    for s in big:
        s.size = len(s.data)
        s.start = alloc(s.data, nsect(s.size))

    # FAT
    fat_bytes = b"".join(struct.pack("<I", v) for v in fat)
    fat_bytes += struct.pack("<I", FREESECT) * (n_fat * SECT // 4 - len(fat))
    for k in range(n_fat):
        sectors[fat_start + k] = fat_bytes[k * SECT:(k + 1) * SECT]

    # Répertoire
    d = bytearray()
    for n in nodes:
        nm = n.name.encode("utf-16-le")
        assert len(nm) <= 62
        e = nm + b"\x00" * (64 - len(nm))
        e += struct.pack("<HBB", len(nm) + 2, n.kind, 1)
        e += struct.pack("<III", n.left, n.right, n.child)
        e += b"\x00" * 16 + struct.pack("<I", 0) + b"\x00" * 16
        start = n.start if n.kind != 1 else 0
        size = n.size if n.kind != 1 else 0
        e += struct.pack("<IQ", start, size)
        d += e
    empty = b"\x00" * 64 + struct.pack("<HBB", 0, 0, 0) + struct.pack("<III", NOSTREAM, NOSTREAM, NOSTREAM) + b"\x00" * 36 + struct.pack("<IQ", 0, 0)
    while len(d) < n_dir * SECT:
        d += empty
    for k in range(n_dir):
        sectors[dir_start + k] = bytes(d[k * SECT:(k + 1) * SECT])

    difat = [fat_start + k for k in range(n_fat)] + [FREESECT] * (109 - n_fat)
    header = bytearray()
    header += bytes.fromhex("D0CF11E0A1B11AE1") + b"\x00" * 16
    header += struct.pack("<HHHHH", 0x003E, 0x0003, 0xFFFE, 9, 6)
    header += b"\x00" * 6
    header += struct.pack("<IIIII", 0, n_fat, dir_start, 0, CUTOFF)
    header += struct.pack("<IIII", minifat_start, n_minifat if minifat else 0, ENDOFCHAIN, 0)
    header += b"".join(struct.pack("<I", v) for v in difat)
    assert len(header) == 512
    return bytes(header) + b"".join(sectors)


def build_vba_project(modules):
    project_id = "{" + str(uuid.uuid4()).upper() + "}"
    vba = {
        "_VBA_PROJECT": bytes([0xCC, 0x61, 0xFF, 0xFF, 0x00, 0x00, 0x00]),
        "dir": compress(_dir_stream(modules)),
    }
    for m in modules:
        src = module_source(m)
        comp = compress(src)
        assert decompress(comp) == src, f"compression incorrecte pour {m['name']}"
        vba[m["name"]] = comp
    tree = {
        "PROJECT": _project_stream(modules, project_id),
        "PROJECTwm": _projectwm(modules),
        "VBA": vba,
    }
    return write_cfb(tree)
