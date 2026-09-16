/// <reference types="node" />
import assert from "node:assert/strict"
import { safeNodes, sampleSpeed, type Node } from "./api.ts"

const node = { id: 1, metrics: { uptime: 100, cpu: 1, load: [0.1, 0.2, 0.3],
  mem_total: 1024, mem_used: 512, swap_total: 0, swap_used: 0, disk_total: 2048, disk_used: 1024,
  net_rx: 10, net_tx: 20, total_rx: 100, total_tx: 200, month_rx: 50, month_tx: 100,
  tcp: 3, udp: 4, procs: 20 } } as Node
assert.equal(safeNodes([node])[0], node)
for (const patch of [{ load: null }, { load: [1, "bad", 3] }, { cpu: "bad" }, { net_rx: Infinity }]) {
  const bad = { ...node, metrics: { ...node.metrics, ...patch } } as unknown as Node
  const result = safeNodes([bad, node])
  assert.equal(result[0].metrics, null)
  assert.equal(result[1], node)
}
console.log("invalid live reports are isolated")

const online = { ...node, online: true }
const first = sampleSpeed([], [online])
assert.deepEqual(first, [{ rx: 10, tx: 20 }])
const updated = { ...online, metrics: { ...online.metrics!, net_rx: 30, net_tx: 40 } }
const second = sampleSpeed(first, [updated, online, { ...updated, online: false }, { ...online, metrics: null }])
assert.deepEqual(second.at(-1), { rx: 40, tx: 60 })
assert.deepEqual(first, [{ rx: 10, tx: 20 }], "new reports must not mutate previous render snapshots")
assert.deepEqual(sampleSpeed(second, []).at(-1), { rx: 0, tx: 0 })
assert.deepEqual(sampleSpeed(second, [{ ...online, online: false }]).at(-1), { rx: 0, tx: 0 })
let history = first
for (let i = 0; i < 100; i++) history = sampleSpeed(history, [updated])
assert.equal(history.length, 60)
assert.deepEqual(history.at(-1), { rx: 30, tx: 40 })
console.log("live speed snapshots update, exclude offline nodes, and retain at most 60 samples")
