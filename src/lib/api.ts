import { useEffect, useState } from "react"
import { DEMO_ME, DEMO_NODES, DEMO_SPEED_POINTS, generateMockHistory } from "./mock"

export type Metrics = {
  uptime: number
  cpu: number
  load: [number, number, number]
  mem_total: number
  mem_used: number
  swap_total: number
  swap_used: number
  disk_total: number
  disk_used: number
  net_rx: number
  net_tx: number
  total_rx: number
  total_tx: number
  month_rx: number
  month_tx: number
  tcp: number
  udp: number
  procs: number
}

export type Node = {
  id: number
  name: string
  sort: number
  public: boolean
  online: boolean
  /** ISO 3166-1 alpha-2, or empty when the hub could not locate the address. */
  country: string
  last_seen: number
  metrics: Metrics | null
  os: string
  kernel: string
  arch: string
  virt: string
  cpu_name: string
  cpu_cores: number
  mem_total: number
  swap_total: number
  disk_total: number
  agent_version: string
  price: number
  currency: string
  billing_cycle: string
  expires_at: string | null
  traffic_limit: number
  traffic_mode: string
  traffic_reset_day: number
  total_rx: number
  total_tx: number
  month_rx: number
  month_tx: number
  month_start: string
  day_rx: number
  day_tx: number
  /** Panel only. */
  hostname?: string
  ip?: string
  remark?: string
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const isExplicitLive =
  typeof window !== "undefined" &&
  (new URLSearchParams(window.location.search).get("mode") === "live" ||
    new URLSearchParams(window.location.search).get("live") !== null ||
    localStorage.getItem("monitor_live") === "true")

if (typeof window !== "undefined" && isExplicitLive) {
  localStorage.removeItem("monitor_demo")
  localStorage.setItem("monitor_live", "true")
}

export let isDemoMode =
  typeof window !== "undefined" && !isExplicitLive && localStorage.getItem("monitor_demo") === "true"

export function setDemoMode(val: boolean) {
  isDemoMode = val
  if (typeof window !== "undefined") {
    if (val) {
      localStorage.setItem("monitor_demo", "true")
      localStorage.removeItem("monitor_live")
    } else {
      localStorage.removeItem("monitor_demo")
      localStorage.setItem("monitor_live", "true")
    }
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (isDemoMode) {
    if (path === "/me") return DEMO_ME as T
    if (path.startsWith("/nodes/")) {
      const match = path.match(/hours=(\d+)/)
      const hours = match ? Number(match[1]) : 6
      return generateMockHistory(hours) as T
    }
    if (path === "/nodes") return { nodes: DEMO_NODES } as T
  }

  try {
    const res = await fetch(`/api${path}`, {
      ...init,
      headers: init?.body ? { "content-type": "application/json", ...init?.headers } : init?.headers,
    })
    if (!res.ok) throw new ApiError(res.status, (await res.text()) || res.statusText)
    return res.status === 204 ? (undefined as T) : res.json()
  } catch (e) {
    if (isDemoMode) {
      if (path === "/me") return DEMO_ME as T
      if (path.startsWith("/nodes/")) return generateMockHistory(6) as T
      if (path === "/nodes") return { nodes: DEMO_NODES } as T
    }
    throw e
  }
}

/**
 * Fleet throughput, one sample per push. Held beside the stream that feeds it
 * rather than in the tile that draws it: the summary unmounts while a node page is
 * open, so a buffer held there would restart empty on every return. Two minutes at
 * the hub's push interval.
 */
const KEEP = 60
export const speedHistory: { rx: number; tx: number }[] = [...DEMO_SPEED_POINTS]

function sample(nodes: Node[]) {
  const live = nodes.filter((n) => n.online && n.metrics)
  speedHistory.push({
    rx: live.reduce((s, n) => s + n.metrics!.net_rx, 0),
    tx: live.reduce((s, n) => s + n.metrics!.net_tx, 0),
  })
  if (speedHistory.length > KEEP) speedHistory.shift()
}

/** A malformed report must not remove every other node from the page. */
export function safeNodes(nodes: Node[]): Node[] {
  const number = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0
  const fields = ["uptime", "cpu", "mem_total", "mem_used", "swap_total", "swap_used", "disk_total", "disk_used",
    "net_rx", "net_tx", "total_rx", "total_tx", "month_rx", "month_tx", "tcp", "udp", "procs"] as const
  return nodes.map((node) => {
    const m = node.metrics
    return !m || (fields.every((key) => number(m[key])) && Array.isArray(m.load) && m.load.length === 3 && m.load.every(number))
      ? node : { ...node, metrics: null }
  })
}

/**
 * Live node list. Uses the WebSocket the hub pushes every two seconds, falling
 * back to polling if it cannot be established.
 */
export function useNodes() {
  const [nodes, setNodes] = useState<Node[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Set when the hub answers 401: the status page has been closed to anonymous
  // callers since this tab loaded. The hub also ends the stream, so this surfaces
  // on the fallback fetch the reconnect starts; a close allows a client to
  // re-query its state but cannot compel it.
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    let socket: WebSocket | null = null
    let poll: ReturnType<typeof setInterval> | null = null
    let retry: ReturnType<typeof setTimeout> | null = null
    let closed = false

    const receive = (list: Node[]) => {
      const safe = safeNodes(list)
      sample(safe)
      setNodes(safe)
      setError(null)
      setClosed(false)
    }

    if (isDemoMode) {
      let currentNodes = [...DEMO_NODES]
      receive(currentNodes)
      const mockTimer = setInterval(() => {
        currentNodes = currentNodes.map((n) => {
          if (!n.metrics) return n
          const drift = (Math.random() - 0.5) * 4
          const cpu = Math.max(5, Math.min(98, n.metrics.cpu + drift))
          const net_rx = Math.max(1024 * 100, n.metrics.net_rx + (Math.random() - 0.5) * 1024 * 1024)
          const net_tx = Math.max(1024 * 100, n.metrics.net_tx + (Math.random() - 0.5) * 2 * 1024 * 1024)
          return {
            ...n,
            metrics: {
              ...n.metrics,
              cpu,
              net_rx,
              net_tx,
            },
          }
        })
        receive(currentNodes)
      }, 2000)
      return () => clearInterval(mockTimer)
    }

    const fetchOnce = () =>
      api<{ nodes: Node[] }>("/nodes")
        .then((d) => receive(d.nodes))
        .catch((e: Error) => {
          if (isDemoMode) {
            receive(DEMO_NODES)
            return
          }
          if (e instanceof ApiError && e.status === 401) {
            setClosed(true)
            setError(e.message)
            return
          }
          if (localStorage.getItem("monitor_live") === "true") {
            setError(e.message || "连接服务器失败")
            return
          }
          // Automatically fallback to demo mode when running standalone without hub
          setDemoMode(true)
          receive(DEMO_NODES)
        })

    fetchOnce()

    const url = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/api/ws`
    // A hub restart closes every stream. Without reconnecting, a page that
    // outlives a deploy would remain on the fallback poll for the rest of its
    // life, refreshing at a fifth of the live rate with no indication.
    const connect = () => {
      try {
        socket = new WebSocket(url)
      } catch {
        poll ??= setInterval(fetchOnce, 5000)
        return
      }
      socket.onmessage = (event) => {
        receive(JSON.parse(event.data).nodes)
        // The stream has returned; the poll was only covering for it.
        if (poll) {
          clearInterval(poll)
          poll = null
        }
      }
      socket.onerror = () => socket?.close()
      socket.onclose = () => {
        if (closed) return
        poll ??= setInterval(fetchOnce, 5000)
        retry = setTimeout(connect, 5000)
      }
    }
    connect()

    return () => {
      closed = true
      socket?.close()
      if (poll) clearInterval(poll)
      if (retry) clearTimeout(retry)
    }
  }, [])

  return { nodes, error, closed }
}
