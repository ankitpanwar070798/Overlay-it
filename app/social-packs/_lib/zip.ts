// Uncompressed ZIP: PNG data is already compressed. No extra package needed.
const encoder = new TextEncoder();
const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
export function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (let index = 0; index < bytes.length; index++) crc = crcTable[(crc ^ bytes[index]) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
export function createZip(files: { name: string; bytes: Uint8Array }[]): Blob {
  const localParts: BlobPart[] = [], directory: BlobPart[] = [];
  let offset = 0, directorySize = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const local = new Uint8Array(30 + name.length);
    const view = new DataView(local.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x800, true);
    view.setUint16(12, 33, true); // Jan 1, 1980, the ZIP epoch.
    view.setUint32(14, crc32(file.bytes), true);
    view.setUint32(18, file.bytes.length, true);
    view.setUint32(22, file.bytes.length, true);
    view.setUint16(26, name.length, true);
    local.set(name, 30);
    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    central.set(local.subarray(4, 30), 6);
    cv.setUint32(42, offset, true);
    central.set(name, 46);
    localParts.push(local, new Uint8Array(file.bytes));
    directory.push(central);
    offset += local.length + file.bytes.length;
    directorySize += central.length;
  }
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, directorySize, true);
  ev.setUint32(16, offset, true);
  return new Blob([...localParts, ...directory, end], { type: "application/zip" });
}
