"use client"

export class BotDetectionClient {
  private sessionId: string
  private apiEndpoint: string
  private mouseMovements = 0
  private clicks = 0
  private keystrokes = 0
  private scrollEvents = 0
  private startTime: number
  private eventBuffer: Array<{ type: string; data: any }> = []
  private flushInterval: NodeJS.Timeout | null = null

  constructor(sessionId: string, apiEndpoint = "/api/bot-detection/event") {
    this.sessionId = sessionId
    this.apiEndpoint = apiEndpoint
    this.startTime = Date.now()
    this.initializeListeners()
    this.startBufferFlush()
  }

  private initializeListeners() {
    if (typeof window === "undefined") return

    window.addEventListener("mousemove", this.handleMouseMove.bind(this))
    window.addEventListener("click", this.handleClick.bind(this))
    window.addEventListener("keypress", this.handleKeypress.bind(this))
    window.addEventListener("scroll", this.handleScroll.bind(this))
    window.addEventListener("touchstart", this.handleTouch.bind(this))
  }

  private handleMouseMove() {
    this.mouseMovements++
    this.bufferEvent("mousemove", { count: this.mouseMovements })
  }

  private handleClick(e: MouseEvent) {
    this.clicks++
    this.bufferEvent("click", {
      x: e.clientX,
      y: e.clientY,
      count: this.clicks,
    })
  }

  private handleKeypress() {
    this.keystrokes++
    this.bufferEvent("keypress", { count: this.keystrokes })
  }

  private handleScroll() {
    this.scrollEvents++
    this.bufferEvent("scroll", { count: this.scrollEvents })
  }

  private handleTouch(e: TouchEvent) {
    this.bufferEvent("touchstart", {
      touches: e.touches.length,
    })
  }

  private bufferEvent(type: string, data: any) {
    this.eventBuffer.push({ type, data })

    // Auto flush if buffer gets too large
    if (this.eventBuffer.length >= 50) {
      this.flushEvents()
    }
  }

  private startBufferFlush() {
    // Flush events every 5 seconds
    this.flushInterval = setInterval(() => {
      this.flushEvents()
    }, 5000)
  }

  private async flushEvents() {
    if (this.eventBuffer.length === 0) return

    const events = [...this.eventBuffer]
    this.eventBuffer = []

    try {
      for (const event of events) {
        await fetch(this.apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.getApiKey(),
          },
          body: JSON.stringify({
            session_id: this.sessionId,
            event_type: event.type,
            event_data: event.data,
          }),
        })
      }
    } catch (error) {
      console.error("[v0] Bot detection flush error:", error)
    }
  }

  private getApiKey(): string {
    // This should be passed from the server or environment
    return (window as any).__BOT_DETECTION_API_KEY__ || ""
  }

  public async analyze(): Promise<any> {
    await this.flushEvents()

    try {
      const response = await fetch("/api/bot-detection/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.getApiKey(),
        },
        body: JSON.stringify({
          session_id: this.sessionId,
        }),
      })

      return await response.json()
    } catch (error) {
      console.error("[v0] Bot analysis error:", error)
      return null
    }
  }

  public destroy() {
    if (typeof window === "undefined") return

    window.removeEventListener("mousemove", this.handleMouseMove.bind(this))
    window.removeEventListener("click", this.handleClick.bind(this))
    window.removeEventListener("keypress", this.handleKeypress.bind(this))
    window.removeEventListener("scroll", this.handleScroll.bind(this))
    window.removeEventListener("touchstart", this.handleTouch.bind(this))

    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }

    this.flushEvents()
  }
}
