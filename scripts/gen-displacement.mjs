import { writeFileSync, mkdirSync } from 'fs'
import { deflateSync } from 'zlib'

const W = 256, H = 256

function rand(x, y) {
  const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return v - Math.floor(v)
}
function noise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y)
  const fx = x - ix, fy = y - iy
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy)
  return rand(ix, iy) * (1 - ux) * (1 - uy)
       + rand(ix+1, iy) * ux * (1 - uy)
       + rand(ix, iy+1) * (1 - ux) * uy
       + rand(ix+1, iy+1) * ux * uy
}
function fbm(x, y) {
  let v = 0, a = 0.5
  for (let i = 0; i < 5; i++) {
    v += a * noise(x, y)
    x = x * 2.1 + 1.7
    y = y * 2.1 + 9.2
    a *= 0.5
  }
  return v
}

// PNG scan lines: filter byte 0 (None) + greyscale pixel per column
const rows = []
for (let y = 0; y < H; y++) {
  const row = Buffer.alloc(1 + W)
  row[0] = 0
  for (let x = 0; x < W; x++) {
    row[1 + x] = Math.round(fbm(x / W * 3.5, y / H * 3.5) * 255)
  }
  rows.push(row)
}
const rawData = Buffer.concat(rows)
const compressed = deflateSync(rawData)

// CRC32
const crcTable = new Int32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
  crcTable[n] = c
}
function crc32(buf) {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}
function pngChunk(type, data) {
  const typeB = Buffer.from(type, 'ascii')
  const lenB = Buffer.alloc(4); lenB.writeUInt32BE(data.length)
  const crcB = Buffer.alloc(4); crcB.writeUInt32BE(crc32(Buffer.concat([typeB, data])))
  return Buffer.concat([lenB, typeB, data, crcB])
}

// IHDR: greyscale, 8-bit
const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4)
ihdr[8] = 8; ihdr[9] = 0; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  pngChunk('IHDR', ihdr),
  pngChunk('IDAT', compressed),
  pngChunk('IEND', Buffer.alloc(0)),
])

mkdirSync('public/textures', { recursive: true })
writeFileSync('public/textures/displacement.png', png)
console.log('Generated public/textures/displacement.png (' + png.length + ' bytes)')
