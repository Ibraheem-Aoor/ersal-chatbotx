/* biome-ignore-all lint/suspicious/noBitwiseOperators: binary format parser/writer requires bitwise ops */
/**
 * Lossless WebM/MP4 → OGG container remux for Opus audio.
 *
 * Chrome and Safari cannot record audio/ogg natively. This module
 * repackages the raw Opus packets from WebM (or MP4) into a valid
 * OGG Opus stream that WhatsApp accepts as a voice note (PTT).
 *
 * No external dependencies — pure TypeScript operating on ArrayBuffers.
 */

// ---------------------------------------------------------------------------
// EBML / WebM parser  (extract Opus packets from a Matroska container)
// ---------------------------------------------------------------------------

const EBML_IDS = {
  Segment: 0x18_53_80_67,
  Tracks: 0x16_54_ae_6b,
  TrackEntry: 0xae,
  CodecPrivate: 0x63_a2,
  Cluster: 0x1f_43_b6_75,
  SimpleBlock: 0xa3,
  BlockGroup: 0xa0,
  Block: 0xa1,
  Timecode: 0xe7,
} as const

function readVint(
  view: DataView,
  offset: number,
): [value: number, length: number] {
  const first = view.getUint8(offset)
  let len = 1
  let mask = 0x80
  while (len <= 8 && (first & mask) === 0) {
    len++
    mask >>= 1
  }
  if (len > 8) {
    throw new Error("Invalid VINT")
  }
  let value = first & (mask - 1)
  for (let i = 1; i < len; i++) {
    value = value * 256 + view.getUint8(offset + i)
  }
  return [value, len]
}

function readElementId(
  view: DataView,
  offset: number,
): [id: number, length: number] {
  const first = view.getUint8(offset)
  let len = 1
  if (first >= 0x80) {
    len = 1
  } else if (first >= 0x40) {
    len = 2
  } else if (first >= 0x20) {
    len = 3
  } else if (first >= 0x10) {
    len = 4
  } else {
    throw new Error("Invalid EBML ID")
  }

  let id = first
  for (let i = 1; i < len; i++) {
    id = id * 256 + view.getUint8(offset + i)
  }
  return [id, len]
}

interface OpusPacket {
  data: Uint8Array
  /** Absolute timestamp in ms within the WebM. */
  timestampMs: number
}

function parseWebm(buffer: ArrayBuffer): {
  codecPrivate: Uint8Array
  packets: OpusPacket[]
} {
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)
  let codecPrivate: Uint8Array | null = null
  const packets: OpusPacket[] = []

  function walk(
    start: number,
    end: number,
    initialClusterTimestamp: number,
    depth: number,
  ) {
    let pos = start
    let clusterTs = initialClusterTimestamp
    while (pos < end) {
      if (pos + 2 > end) {
        break
      }
      let idLen: number
      let id: number
      try {
        ;[id, idLen] = readElementId(view, pos)
      } catch {
        break
      }
      pos += idLen

      if (pos >= end) {
        break
      }
      let sizeLen: number
      let size: number
      try {
        ;[size, sizeLen] = readVint(view, pos)
      } catch {
        break
      }
      pos += sizeLen

      const unknown = size === (1 << (7 * sizeLen)) - 1

      const dataStart = pos
      const dataEnd = unknown ? end : Math.min(pos + size, end)

      switch (id) {
        case EBML_IDS.Segment:
          walk(dataStart, dataEnd, 0, depth + 1)
          break
        case EBML_IDS.Tracks:
          walk(dataStart, dataEnd, 0, depth + 1)
          break
        case EBML_IDS.TrackEntry:
          walk(dataStart, dataEnd, 0, depth + 1)
          break
        case EBML_IDS.CodecPrivate:
          codecPrivate = bytes.slice(dataStart, dataEnd)
          break
        case EBML_IDS.Cluster:
          walk(dataStart, dataEnd, 0, depth + 1)
          break
        case EBML_IDS.Timecode:
          clusterTs = 0
          for (let i = dataStart; i < dataEnd; i++) {
            clusterTs = clusterTs * 256 + bytes[i]
          }
          if (depth > 0) {
            walkClusterRemaining(dataEnd, end, clusterTs)
            pos = end
            return
          }
          break
        case EBML_IDS.SimpleBlock:
        case EBML_IDS.Block:
          parseBlock(bytes.slice(dataStart, dataEnd), clusterTs, packets)
          break
        case EBML_IDS.BlockGroup:
          walk(dataStart, dataEnd, clusterTs, depth + 1)
          break
        default:
          break
      }
      pos = dataEnd
    }
  }

  function walkClusterRemaining(
    start: number,
    end: number,
    initialClusterTs: number,
  ) {
    let pos = start
    let currentTs = initialClusterTs
    while (pos < end) {
      if (pos + 2 > end) {
        break
      }
      let id: number
      let idLen: number
      try {
        ;[id, idLen] = readElementId(view, pos)
      } catch {
        break
      }
      pos += idLen
      if (pos >= end) {
        break
      }
      let size: number
      let sizeLen: number
      try {
        ;[size, sizeLen] = readVint(view, pos)
      } catch {
        break
      }
      pos += sizeLen
      const dStart = pos
      const dEnd = Math.min(pos + size, end)

      if (id === EBML_IDS.SimpleBlock || id === EBML_IDS.Block) {
        parseBlock(bytes.slice(dStart, dEnd), currentTs, packets)
      } else if (id === EBML_IDS.BlockGroup) {
        walkClusterRemaining(dStart, dEnd, currentTs)
      } else if (id === EBML_IDS.Timecode) {
        let ts = 0
        for (let i = dStart; i < dEnd; i++) {
          ts = ts * 256 + bytes[i]
        }
        currentTs = ts
      }
      pos = dEnd
    }
  }

  walk(0, buffer.byteLength, 0, 0)

  if (!codecPrivate) {
    codecPrivate = defaultOpusHead()
  }

  return { codecPrivate, packets }
}

function parseBlock(data: Uint8Array, clusterTs: number, out: OpusPacket[]) {
  let pos = 0
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)

  let trackLen: number
  try {
    ;[, trackLen] = readVint(view, 0)
  } catch {
    return
  }
  pos += trackLen

  if (pos + 2 >= data.length) {
    return
  }
  const relativeTs = (data[pos] << 8) | data[pos + 1]
  const signedTs = relativeTs > 32_767 ? relativeTs - 65_536 : relativeTs
  pos += 2

  // flags byte
  pos += 1

  if (pos >= data.length) {
    return
  }
  out.push({
    data: data.slice(pos),
    timestampMs: clusterTs + signedTs,
  })
}

function defaultOpusHead(): Uint8Array {
  // Minimal OpusHead: version 1, 1 channel, 0 pre-skip, 48000 Hz, 0 gain, mapping 0
  const head = new Uint8Array(19)
  head.set([0x4f, 0x70, 0x75, 0x73, 0x48, 0x65, 0x61, 0x64]) // "OpusHead"
  head[8] = 1 // version
  head[9] = 1 // channel count
  // pre-skip = 3840 (80ms @ 48kHz) — little-endian
  head[10] = 0x00
  head[11] = 0x0f
  // sample rate = 48000 — little-endian
  head[12] = 0x80
  head[13] = 0xbb
  head[14] = 0x00
  head[15] = 0x00
  // output gain = 0
  head[16] = 0x00
  head[17] = 0x00
  // mapping family = 0
  head[18] = 0x00
  return head
}

// ---------------------------------------------------------------------------
// OGG page writer
// ---------------------------------------------------------------------------

const OGG_CAPTURE = new Uint8Array([0x4f, 0x67, 0x67, 0x53]) // "OggS"
const SERIAL = 0x43_42_54_58 // "CBTX"

function crc32Ogg(data: Uint8Array): number {
  let crc = 0
  for (const byte of data) {
    crc = ((crc << 8) ^ crcTable[((crc >>> 24) & 0xff) ^ byte]) >>> 0
  }
  return crc
}

const crcTable = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let r = i << 24
    for (let j = 0; j < 8; j++) {
      r = r & 0x80_00_00_00 ? ((r << 1) ^ 0x04_c1_1d_b7) >>> 0 : (r << 1) >>> 0
    }
    table[i] = r
  }
  return table
})()

function writeOggPage(opts: {
  granulePosition: bigint
  pageSequence: number
  headerType: number
  segments: Uint8Array[]
}): Uint8Array {
  const { granulePosition, pageSequence, headerType, segments } = opts

  const segmentTable: number[] = []
  for (const seg of segments) {
    let remaining = seg.length
    while (remaining >= 255) {
      segmentTable.push(255)
      remaining -= 255
    }
    segmentTable.push(remaining)
  }

  const headerSize = 27 + segmentTable.length
  let bodySize = 0
  for (const seg of segments) {
    bodySize += seg.length
  }
  const page = new Uint8Array(headerSize + bodySize)
  const view = new DataView(page.buffer)

  page.set(OGG_CAPTURE, 0)
  page[4] = 0 // version
  page[5] = headerType
  view.setBigUint64(6, granulePosition, true)
  view.setUint32(14, SERIAL, true)
  view.setUint32(18, pageSequence, true)
  // CRC placeholder at 22 (4 bytes)
  page[26] = segmentTable.length

  for (let i = 0; i < segmentTable.length; i++) {
    page[27 + i] = segmentTable[i]
  }

  let offset = headerSize
  for (const seg of segments) {
    page.set(seg, offset)
    offset += seg.length
  }

  const crc = crc32Ogg(page)
  view.setUint32(22, crc, true)

  return page
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function buildOpusHead(codecPrivate: Uint8Array): Uint8Array {
  if (
    codecPrivate.length >= 8 &&
    codecPrivate[0] === 0x4f &&
    codecPrivate[1] === 0x70 &&
    codecPrivate[2] === 0x75 &&
    codecPrivate[3] === 0x73
  ) {
    return codecPrivate
  }
  // Wrap raw codec config in an OpusHead
  const head = defaultOpusHead()
  if (codecPrivate.length >= 2) {
    head[9] = codecPrivate[1] // channel count
  }
  return head
}

function buildOpusTags(): Uint8Array {
  const vendor = "ChatbotX"
  const vendorBytes = new TextEncoder().encode(vendor)
  const tags = new Uint8Array(8 + 4 + vendorBytes.length + 4)
  tags.set(new TextEncoder().encode("OpusTags"), 0)
  const view = new DataView(tags.buffer)
  view.setUint32(8, vendorBytes.length, true)
  tags.set(vendorBytes, 12)
  view.setUint32(12 + vendorBytes.length, 0, true) // 0 user comments
  return tags
}

const OPUS_SAMPLES_PER_MS = 48 // 48 kHz

export async function remuxToOgg(blob: Blob): Promise<Blob> {
  const buffer = await blob.arrayBuffer()
  const { codecPrivate, packets } = parseWebm(buffer)

  if (packets.length === 0) {
    throw new Error("No Opus packets found in recording")
  }

  const opusHead = buildOpusHead(codecPrivate)
  const opusTags = buildOpusTags()

  const preSkip =
    opusHead.length >= 12 ? opusHead[10] | (opusHead[11] << 8) : 3840

  const pages: Uint8Array[] = []
  let pageSeq = 0

  // Page 0: BOS + OpusHead
  pages.push(
    writeOggPage({
      granulePosition: 0n,
      pageSequence: pageSeq++,
      headerType: 0x02, // BOS
      segments: [opusHead],
    }),
  )

  // Page 1: OpusTags
  pages.push(
    writeOggPage({
      granulePosition: 0n,
      pageSequence: pageSeq++,
      headerType: 0x00,
      segments: [opusTags],
    }),
  )

  // Audio pages: batch up to ~64KB per page
  const MAX_PAGE_BODY = 60_000
  let batch: Uint8Array[] = []
  let batchSize = 0
  let lastGranule = BigInt(preSkip)

  for (let i = 0; i < packets.length; i++) {
    const pkt = packets[i]
    batch.push(pkt.data)
    batchSize += pkt.data.length

    const granule =
      BigInt(pkt.timestampMs) * BigInt(OPUS_SAMPLES_PER_MS) + BigInt(preSkip)
    if (granule > lastGranule) {
      lastGranule = granule
    }

    const isLast = i === packets.length - 1
    if (batchSize >= MAX_PAGE_BODY || isLast) {
      pages.push(
        writeOggPage({
          granulePosition: lastGranule,
          pageSequence: pageSeq++,
          headerType: isLast ? 0x04 : 0x00, // EOS on last
          segments: batch,
        }),
      )
      batch = []
      batchSize = 0
    }
  }

  let totalSize = 0
  for (const p of pages) {
    totalSize += p.length
  }
  const result = new Uint8Array(totalSize)
  let off = 0
  for (const p of pages) {
    result.set(p, off)
    off += p.length
  }

  return new Blob([result], { type: "audio/ogg" })
}
