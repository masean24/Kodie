# Modul `turtle` virtual untuk Kodie Lab (dijalankan di Pyodide, di dalam Web Worker).
#
# Browser tidak punya Tk, jadi modul ini meniru API turtle CPython (mode "standard") dan
# mencatat perintah relatif. Kanvas Kodie Lab menggambar perintah itu dengan mesin geometri
# TypeScript (src/lib/lab/turtle.ts). Keadaan di sini (posisi, arah) dihitung dengan rumus
# yang sama agar xcor(), pos(), heading(), distance(), dan towards() bernilai benar.
#
# Setiap perintah membawa "t" (id turtle), jadi beberapa Turtle() bisa menggambar bersamaan.

import math
import json

_PERINTAH = []
_MAKS_PERINTAH = 20000
_STATE = {"hitung": 0, "default": None, "mode_warna": 1.0, "latar": "white"}


class TurtleGraphicsError(Exception):
    pass


Terminator = TurtleGraphicsError


def _kirim(p):
    if len(_PERINTAH) >= _MAKS_PERINTAH:
        raise RuntimeError(
            "Gambar terlalu panjang: maksimal 20000 perintah turtle. "
            "Cek apakah ada perulangan tanpa akhir."
        )
    _PERINTAH.append(p)


def _normal(a):
    r = a % 360.0
    if r < 1e-9 or 360.0 - r < 1e-9:
        return 0.0
    return r


def _cos(a):
    a = _normal(a)
    if a == 0:
        return 1.0
    if a == 90 or a == 270:
        return 0.0
    if a == 180:
        return -1.0
    return math.cos(a * math.pi / 180)


def _sin(a):
    a = _normal(a)
    if a == 0 or a == 180:
        return 0.0
    if a == 90:
        return 1.0
    if a == 270:
        return -1.0
    return math.sin(a * math.pi / 180)


def _angka(nilai, nama):
    if isinstance(nilai, bool) or not isinstance(nilai, (int, float)):
        raise TypeError("%s harus berupa angka, bukan %r" % (nama, nilai))
    return float(nilai)


def _warna(args):
    """Ubah argumen warna (nama, '#hex', tuple RGB) menjadi string warna CSS."""
    if len(args) == 1:
        c = args[0]
        if isinstance(c, str):
            if not c.strip():
                raise TurtleGraphicsError("Warna tidak boleh kosong")
            return c.strip()
        if isinstance(c, (tuple, list)):
            args = tuple(c)
        else:
            raise TurtleGraphicsError("Warna tidak valid: %r" % (c,))
    if len(args) == 3:
        r, g, b = (_angka(v, "Komponen warna") for v in args)
        if _STATE["mode_warna"] == 1.0:
            if not all(0 <= v <= 1 for v in (r, g, b)):
                raise TurtleGraphicsError(
                    "Warna RGB harus 0 sampai 1. Untuk 0 sampai 255, panggil turtle.colormode(255) dulu."
                )
            r, g, b = (round(v * 255) for v in (r, g, b))
        elif not all(0 <= v <= 255 for v in (r, g, b)):
            raise TurtleGraphicsError("Warna RGB harus 0 sampai 255")
        return "rgb(%d,%d,%d)" % (int(r), int(g), int(b))
    raise TurtleGraphicsError("Argumen warna tidak valid: %r" % (args,))


class Turtle:
    def __init__(self, shape="classic", undobuffersize=1000, visible=True):
        self._id = _STATE["hitung"]
        _STATE["hitung"] += 1
        self._x = 0.0
        self._y = 0.0
        self._arah = 0.0
        self._turun = True
        self._tebal = 1.0
        self._pena = "black"
        self._isi = "black"
        self._terlihat = True
        self._mengisi = False
        # Daftarkan turtle ini ke kanvas meski belum bergerak, agar kepalanya tampil.
        _kirim({"k": "tampak", "t": self._id, "terlihat": True})
        if not visible:
            self.hideturtle()

    # ---------- gerak ----------
    def _geser(self, d):
        self._x += d * _cos(self._arah)
        self._y += d * _sin(self._arah)

    def forward(self, distance):
        d = _angka(distance, "Jarak")
        self._geser(d)
        _kirim({"k": "maju", "t": self._id, "jarak": d})

    fd = forward

    def backward(self, distance):
        self.forward(-_angka(distance, "Jarak"))

    back = backward
    bk = backward

    def left(self, angle):
        a = _angka(angle, "Sudut")
        self._arah = _normal(self._arah + a)
        _kirim({"k": "putar", "t": self._id, "sudut": a})

    lt = left

    def right(self, angle):
        self.left(-_angka(angle, "Sudut"))

    rt = right

    def setheading(self, to_angle):
        a = _angka(to_angle, "Sudut")
        self._arah = _normal(a)
        _kirim({"k": "arah", "t": self._id, "sudut": a})

    seth = setheading

    def goto(self, x, y=None):
        if y is None:
            x, y = x[0], x[1]
        self._x = _angka(x, "x")
        self._y = _angka(y, "y")
        _kirim({"k": "ke", "t": self._id, "x": self._x, "y": self._y})

    setpos = goto
    setposition = goto

    def setx(self, x):
        self.goto(_angka(x, "x"), self._y)

    def sety(self, y):
        self.goto(self._x, _angka(y, "y"))

    def home(self):
        self.goto(0.0, 0.0)
        self.setheading(0.0)

    def circle(self, radius, extent=None, steps=None):
        r = _angka(radius, "Jari-jari")
        e = 360.0 if extent is None else _angka(extent, "Busur")
        if e == 0:
            return
        if steps is None:
            n = 1 + int(min(11 + abs(r) / 6.0, 59.0) * abs(e) / 360.0)
        else:
            n = int(steps)
            if n < 1:
                raise ValueError("steps harus minimal 1")
        w = e / n
        w2 = 0.5 * w
        panjang = 2.0 * r * math.sin(w2 * math.pi / 180)
        if r < 0:
            panjang, w, w2 = -panjang, -w, -w2
        self._arah = _normal(self._arah + w2)
        for _ in range(n):
            self._geser(panjang)
            self._arah = _normal(self._arah + w)
        self._arah = _normal(self._arah - w2)
        _kirim({"k": "lingkaran", "t": self._id, "jari": r, "busur": e, "langkah": n})

    # ---------- pena ----------
    def penup(self):
        self._turun = False
        _kirim({"k": "pena", "t": self._id, "turun": False})

    pu = penup
    up = penup

    def pendown(self):
        self._turun = True
        _kirim({"k": "pena", "t": self._id, "turun": True})

    pd = pendown
    down = pendown

    def isdown(self):
        return self._turun

    def pensize(self, width=None):
        if width is None:
            return self._tebal
        self._tebal = _angka(width, "Tebal pena")
        _kirim({"k": "tebal", "t": self._id, "ukuran": self._tebal})

    width = pensize

    def pencolor(self, *args):
        if not args:
            return self._pena
        self._pena = _warna(args)
        _kirim({"k": "warna", "t": self._id, "pena": self._pena})

    def fillcolor(self, *args):
        if not args:
            return self._isi
        self._isi = _warna(args)
        _kirim({"k": "warna", "t": self._id, "isi": self._isi})

    def color(self, *args):
        if not args:
            return (self._pena, self._isi)
        if len(args) == 2:
            self._pena = _warna((args[0],))
            self._isi = _warna((args[1],))
        else:
            self._pena = self._isi = _warna(args)
        _kirim({"k": "warna", "t": self._id, "pena": self._pena, "isi": self._isi})

    def begin_fill(self):
        self._mengisi = True
        _kirim({"k": "mulai_isi", "t": self._id})

    def end_fill(self):
        self._mengisi = False
        _kirim({"k": "selesai_isi", "t": self._id})

    def filling(self):
        return self._mengisi

    def dot(self, size=None, *color):
        if not color and isinstance(size, (str, tuple)):
            color = (size,)
            size = None
        p = {"k": "titik", "t": self._id}
        if size is not None:
            p["ukuran"] = _angka(size, "Ukuran titik")
        if color:
            p["warna"] = _warna(color)
        _kirim(p)

    def write(self, arg, move=False, align="left", font=("Arial", 8, "normal")):
        ukuran = 8
        if isinstance(font, (tuple, list)) and len(font) >= 2:
            try:
                ukuran = int(font[1])
            except (TypeError, ValueError):
                pass
        rata = align if align in ("left", "center", "right") else "left"
        _kirim({"k": "tulis", "t": self._id, "teks": str(arg), "ukuran": ukuran, "rata": rata})

    # ---------- tampilan & keadaan ----------
    def hideturtle(self):
        self._terlihat = False
        _kirim({"k": "tampak", "t": self._id, "terlihat": False})

    ht = hideturtle

    def showturtle(self):
        self._terlihat = True
        _kirim({"k": "tampak", "t": self._id, "terlihat": True})

    st = showturtle

    def isvisible(self):
        return self._terlihat

    def speed(self, speed=None):
        # Kecepatan animasi diatur dari kanvas Kodie Lab; nilai ini diterima agar kode tetap jalan.
        return 3 if speed is None else None

    def shape(self, name=None):
        return "classic" if name is None else None

    def shapesize(self, *args, **kwargs):
        return None

    turtlesize = shapesize

    def clear(self):
        _kirim({"k": "bersihkan", "t": self._id})

    def reset(self):
        self.clear()
        self.penup()
        self.home()
        self.pendown()
        self.pensize(1)
        self.color("black")
        self.showturtle()

    def xcor(self):
        return self._x

    def ycor(self):
        return self._y

    def position(self):
        return (self._x, self._y)

    pos = position

    def heading(self):
        return self._arah

    def distance(self, x, y=None):
        if y is None:
            if isinstance(x, Turtle):
                x, y = x._x, x._y
            else:
                x, y = x[0], x[1]
        return math.hypot(_angka(x, "x") - self._x, _angka(y, "y") - self._y)

    def towards(self, x, y=None):
        if y is None:
            if isinstance(x, Turtle):
                x, y = x._x, x._y
            else:
                x, y = x[0], x[1]
        sudut = math.degrees(math.atan2(_angka(y, "y") - self._y, _angka(x, "x") - self._x))
        return _normal(round(sudut, 10))

    def getscreen(self):
        return _LAYAR


Pen = Turtle
RawTurtle = Turtle
RawPen = Turtle


class _Layar:
    def bgcolor(self, *args):
        if not args:
            return _STATE["latar"]
        _STATE["latar"] = _warna(args)
        _kirim({"k": "latar", "warna": _STATE["latar"]})

    def colormode(self, cmode=None):
        if cmode is None:
            return 255 if _STATE["mode_warna"] == 255 else 1.0
        if cmode not in (1, 1.0, 255):
            raise TurtleGraphicsError("colormode hanya boleh 1.0 atau 255")
        _STATE["mode_warna"] = 255 if cmode == 255 else 1.0

    def turtles(self):
        return []

    def _abaikan(self, *args, **kwargs):
        return None

    title = setup = screensize = tracer = update = delay = listen = _abaikan
    mainloop = done = exitonclick = bye = _abaikan


_LAYAR = _Layar()


def Screen():
    return _LAYAR


def _turtle_default():
    if _STATE["default"] is None:
        _STATE["default"] = Turtle()
    return _STATE["default"]


def _delegasi(nama):
    def fungsi(*args, **kwargs):
        return getattr(_turtle_default(), nama)(*args, **kwargs)

    fungsi.__name__ = nama
    return fungsi


_FUNGSI_TURTLE = [
    "forward", "fd", "backward", "back", "bk", "left", "lt", "right", "rt",
    "setheading", "seth", "goto", "setpos", "setposition", "setx", "sety", "home", "circle",
    "penup", "pu", "up", "pendown", "pd", "down", "isdown", "pensize", "width",
    "pencolor", "fillcolor", "color", "begin_fill", "end_fill", "filling", "dot", "write",
    "hideturtle", "ht", "showturtle", "st", "isvisible", "speed", "shape", "shapesize",
    "turtlesize", "clear", "reset", "xcor", "ycor", "position", "pos", "heading",
    "distance", "towards",
]
for _nama in _FUNGSI_TURTLE:
    globals()[_nama] = _delegasi(_nama)

bgcolor = _LAYAR.bgcolor
colormode = _LAYAR.colormode
title = setup = screensize = tracer = update = delay = listen = _LAYAR._abaikan
mainloop = done = exitonclick = bye = _LAYAR._abaikan

__all__ = ["Turtle", "Pen", "RawTurtle", "RawPen", "Screen", "TurtleGraphicsError", "Terminator",
           "bgcolor", "colormode", "title", "setup", "screensize", "tracer", "update", "delay",
           "listen", "mainloop", "done", "exitonclick", "bye"] + _FUNGSI_TURTLE


def _kodie_reset():
    _PERINTAH.clear()
    _STATE["hitung"] = 0
    _STATE["default"] = None
    _STATE["mode_warna"] = 1.0
    _STATE["latar"] = "white"


def _kodie_json():
    return json.dumps(_PERINTAH)
