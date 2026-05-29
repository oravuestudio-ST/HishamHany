import { writeFileSync } from 'fs'

// Minimal 1×1 24-bit ICO in ebony (#0f0f10)
const ico = Buffer.from([
  // ICO header (6 bytes)
  0x00, 0x00,             // reserved
  0x01, 0x00,             // type: 1 = ICO
  0x01, 0x00,             // image count: 1
  // Image directory entry (16 bytes)
  0x01,                   // width: 1px
  0x01,                   // height: 1px
  0x00,                   // color count: 0 = true color
  0x00,                   // reserved
  0x01, 0x00,             // planes: 1
  0x18, 0x00,             // bit count: 24
  0x30, 0x00, 0x00, 0x00, // bytes in resource: 48
  0x16, 0x00, 0x00, 0x00, // image data offset: 22
  // BITMAPINFOHEADER (40 bytes)
  0x28, 0x00, 0x00, 0x00, // header size: 40
  0x01, 0x00, 0x00, 0x00, // width: 1
  0x02, 0x00, 0x00, 0x00, // height: 2 (×2 required by ICO format)
  0x01, 0x00,             // planes: 1
  0x18, 0x00,             // bit count: 24
  0x00, 0x00, 0x00, 0x00, // compression: none
  0x04, 0x00, 0x00, 0x00, // image data size: 4 bytes
  0x00, 0x00, 0x00, 0x00, // x pixels/meter
  0x00, 0x00, 0x00, 0x00, // y pixels/meter
  0x00, 0x00, 0x00, 0x00, // colors used
  0x00, 0x00, 0x00, 0x00, // important colors
  // XOR image: BGR pixel for #0f0f10 + 1 byte row padding (rows must be 4-byte aligned)
  0x10, 0x0f, 0x0f, 0x00,
  // AND mask: 4 bytes, all 0x00 = fully opaque
  0x00, 0x00, 0x00, 0x00,
])

writeFileSync('app/favicon.ico', ico)
console.log('Generated app/favicon.ico (' + ico.length + ' bytes)')
