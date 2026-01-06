'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import * as ort from 'onnxruntime-web'

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

type Meta = { window: number; horizon: number }

function parseCsvNumbers(s: string): number[] {
  return s
    .split(/[\s,;\n\r]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x))
}

function meanStd(xs: number[]) {
  const m = xs.reduce((a, b) => a + b, 0) / xs.length
  const v = xs.reduce((a, b) => a + (b - m) * (b - m), 0) / xs.length
  const sd = Math.sqrt(v) || 1
  return { m, sd }
}

export default function ForecastDemo() {
  const [meta, setMeta] = useState<Meta | null>(null)
  const [session, setSession] = useState<ort.InferenceSession | null>(null)
  const [status, setStatus] = useState<string>('loading…')

  const [csv, setCsv] = useState<string>(() => {
    // demo time series
    const xs = Array.from({ length: 80 }, (_, i) => Math.sin(i / 6))
    return xs.map((x) => x.toFixed(4)).join(', ')
  })

  const series = useMemo(() => parseCsvNumbers(csv), [csv])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        setStatus('loading meta…')
        const metaRes = await fetch('/models/forecast.meta.json')
        const m = (await metaRes.json()) as Meta
        if (cancelled) return
        setMeta(m)

        // (optional) acceleration / wasm configuration:
        // ort.env.wasm.numThreads = Math.min(4, navigator.hardwareConcurrency || 1);

        setStatus('creating session…')

        // Try WebGPU if available, otherwise wasm.
        // ONNX Runtime Web allows specifying executionProviders as a list.
        const s = await ort.InferenceSession.create('/models/forecast.onnx', {
          executionProviders: ['webgpu', 'wasm'],
          graphOptimizationLevel: 'all',
        })

        if (cancelled) return
        setSession(s)
        setStatus('ready ✅')
      } catch (e: any) {
        console.error(e)
        setStatus(`error: ${e?.message ?? String(e)}`)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const [forecast, setForecast] = useState<number[] | null>(null)

  async function runForecast() {
    if (!meta || !session) return

    if (series.length < meta.window) {
      setForecast(null)
      setStatus(`need at least ${meta.window} numbers`)
      return
    }

    setStatus('running inference…')

    // Take the last WINDOW points and normalize
    const windowVals = series.slice(-meta.window)
    const { m, sd } = meanStd(windowVals)
    const norm = windowVals.map((x) => (x - m) / sd)

    // ort.Tensor: float32 [1, window]
    const input = new ort.Tensor('float32', Float32Array.from(norm), [
      1,
      meta.window,
    ])

    const outputs = await session.run({ input })
    const out = outputs['output']
    if (!out) throw new Error('Missing output')

    const yNorm = Array.from(out.data as Float32Array)
    const y = yNorm.map((x) => x * sd + m) // denormalize

    setForecast(y)
    setStatus('ready ✅')
  }

  // Data for the chart
  const plotData = useMemo(() => {
    const xHist = series.map((_, i) => i)
    const yHist = series

    let xFc: number[] = []
    let yFc: number[] = []

    if (forecast && meta) {
      const start = series.length - 1
      xFc = forecast.map((_, i) => start + 1 + i)
      yFc = forecast
    }

    return [
      {
        x: xHist,
        y: yHist,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'history',
      },
      ...(forecast && meta
        ? [
            {
              x: xFc,
              y: yFc,
              type: 'scatter',
              mode: 'lines+markers',
              name: 'forecast',
            },
          ]
        : []),
    ]
  }, [series, forecast, meta])

  return (
    <main className="p-6 flex justify-center">
      <div className="grid gap-4 max-w-4xl w-full">
        <div className="grid gap-2">
          <div className="flex gap-3 items-center flex-wrap">
            <button
              onClick={runForecast}
              disabled={
                !session ||
                !meta ||
                status.startsWith('loading') ||
                status.startsWith('creating')
              }
              className="px-3.5 py-2.5 rounded-lg cursor-pointer bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Run forecast
            </button>
            <div className="opacity-80 text-sm">
              Status: <code className="font-mono">{status}</code>
            </div>
            {meta && (
              <div className="opacity-80 text-sm">
                window=<code className="font-mono">{meta.window}</code>,
                horizon=
                <code className="font-mono">{meta.horizon}</code>
              </div>
            )}
          </div>

          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={6}
            className="w-full p-3 rounded-xl font-mono border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1,2,3,4,..."
          />
          <div className="opacity-70 text-sm">
            Parsed points: {series.length}
          </div>
        </div>

        <div className="border border-gray-300 rounded-2xl p-3">
          {/* @ts-ignore */}
          <Plot
            // @ts-ignore
            data={plotData as any}
            layout={{
              title: 'History + Forecast',
              autosize: true,
              height: 420,
              margin: { l: 50, r: 20, t: 50, b: 40 },
            }}
            style={{ width: '100%' }}
            useResizeHandler
          />
        </div>
      </div>
    </main>
  )
}
