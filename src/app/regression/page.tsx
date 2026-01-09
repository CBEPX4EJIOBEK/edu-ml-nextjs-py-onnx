'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })

type Meta = {
  input_size: number
  output_size: number
  description: string
}

function parseCsvNumbers(s: string): number[] {
  return s
    .split(/[\s,;\n\r]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x))
}

// Simple gradient descent implementation for visualization
function gradientDescentStep(
  x: number[],
  y: number[],
  w: number,
  b: number,
  lr: number
): { w: number; b: number; loss: number } {
  const n = x.length
  let dw = 0
  let db = 0
  let loss = 0

  for (let i = 0; i < n; i++) {
    const pred = w * x[i] + b
    const error = pred - y[i]
    dw += (2 / n) * x[i] * error
    db += (2 / n) * error
    loss += error * error
  }

  return {
    w: w - lr * dw,
    b: b - lr * db,
    loss: loss / n,
  }
}

export default function RegressionDemo() {
  const [meta, setMeta] = useState<Meta | null>(null)
  const [session, setSession] = useState<any>(null)
  const [ortApi, setOrtApi] = useState<any>(null)
  const [status, setStatus] = useState<string>('loading…')

  // Training data
  const [trainingData, setTrainingData] = useState<{
    x: number[]
    y: number[]
  } | null>(null)

  // Gradient descent state
  const [isTraining, setIsTraining] = useState(false)
  const [gdHistory, setGdHistory] = useState<
    Array<{ epoch: number; w: number; b: number; loss: number }>
  >([])
  const [currentParams, setCurrentParams] = useState<{
    w: number
    b: number
  } | null>(null)

  // Forecasting
  const [forecastX, setForecastX] = useState<string>('6, 7, 8, 9, 10')
  const [forecastY, setForecastY] = useState<number[]>([])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        setStatus('loading meta…')
        const metaRes = await fetch('/models/linear_regression.meta.json')
        const m = (await metaRes.json()) as Meta
        if (cancelled) return
        setMeta(m)

        setStatus('creating session…')

        const ort = await import('onnxruntime-web')
        // onnxruntime-web exports InferenceSession as a named export
        // Try named export first, then default export
        const ortApi: any = ort.InferenceSession
          ? ort // Named exports (ort.InferenceSession)
          : ort.default?.InferenceSession
            ? ort.default // Default export with InferenceSession
            : ort.default || ort // Fallback

        if (!ortApi?.InferenceSession) {
          console.error('ONNX Runtime Web import failed. Module structure:', {
            hasInferenceSession: !!ort.InferenceSession,
            hasDefault: !!ort.default,
            hasDefaultInferenceSession: !!ort.default?.InferenceSession,
            allKeys: Object.keys(ort),
            defaultKeys: ort.default
              ? Object.keys(ort.default).slice(0, 15)
              : [],
          })
          throw new Error(
            'Failed to load ONNX Runtime Web API. InferenceSession not found. Check browser console for details.'
          )
        }

        setOrtApi(ortApi)
        // Fetch model as bytes to avoid URL processing issues
        setStatus('loading model…')
        const modelResponse = await fetch('/models/linear_regression.onnx')
        if (!modelResponse.ok) {
          throw new Error(`Failed to fetch model: ${modelResponse.statusText}`)
        }
        const modelArrayBuffer = await modelResponse.arrayBuffer()
        const modelBytes = new Uint8Array(modelArrayBuffer)
        
        // Create session with model bytes instead of URL
        const s = await ortApi.InferenceSession.create(modelBytes, {
          executionProviders: ['webgpu', 'wasm'],
          graphOptimizationLevel: 'all',
        })

        if (cancelled) return
        setSession(s)
        setStatus('ready ✅')

        // Generate training data
        const rng = (seed: number) => {
          let value = seed
          return () => {
            value = (value * 9301 + 49297) % 233280
            return value / 233280
          }
        }
        const random = rng(42)
        const x: number[] = []
        const y: number[] = []
        for (let i = 0; i < 50; i++) {
          const xi = (random() - 0.5) * 10
          const yi = 2 * xi + 1 + (random() - 0.5) * 0.5
          x.push(xi)
          y.push(yi)
        }
        setTrainingData({ x, y })
      } catch (e: any) {
        console.error(e)
        setStatus(`error: ${e?.message ?? String(e)}`)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  async function runGradientDescent() {
    if (!trainingData) return

    setIsTraining(true)
    setGdHistory([])
    setStatus('training with gradient descent…')

    // Initialize parameters
    let w = Math.random() * 4 - 2 // Random between -2 and 2
    let b = Math.random() * 4 - 2
    const lr = 0.01
    const epochs = 100
    const history: Array<{
      epoch: number
      w: number
      b: number
      loss: number
    }> = []

    for (let epoch = 0; epoch < epochs; epoch++) {
      const result = gradientDescentStep(
        trainingData.x,
        trainingData.y,
        w,
        b,
        lr
      )
      w = result.w
      b = result.b

      if (epoch % 10 === 0 || epoch === epochs - 1) {
        history.push({
          epoch,
          w,
          b,
          loss: result.loss,
        })
        setGdHistory([...history])
        setCurrentParams({ w, b })
        await new Promise((resolve) => setTimeout(resolve, 50)) // Small delay for visualization
      }
    }

    setCurrentParams({ w, b })
    setIsTraining(false)
    setStatus('training complete ✅')
  }

  async function runForecast() {
    if (!meta || !session || !currentParams || !ortApi) {
      setStatus('need to train model first')
      return
    }

    const forecastXValues = parseCsvNumbers(forecastX)
    if (forecastXValues.length === 0) {
      setForecastY([])
      return
    }

    setStatus('forecasting…')

    try {
      const results: number[] = []
      for (const x of forecastXValues) {
        const input = new ortApi.Tensor('float32', Float32Array.from([x]), [
          1,
          meta.input_size,
        ])

        const outputs = await session.run({ input })
        const out = outputs['output']
        if (!out) throw new Error('Missing output')

        const y = Array.from(out.data as Float32Array)[0]
        results.push(y)
      }

      setForecastY(results)
      setStatus('ready ✅')
    } catch (e: any) {
      console.error(e)
      setStatus(`error: ${e?.message ?? String(e)}`)
    }
  }

  // Chart data for training visualization
  const trainingPlotData = useMemo(() => {
    if (!trainingData) return []

    const traces: any[] = [
      {
        x: trainingData.x,
        y: trainingData.y,
        type: 'scatter',
        mode: 'markers',
        name: 'Training Data',
        marker: { size: 8, color: 'blue' },
      },
    ]

    // Add current regression line if params exist
    if (currentParams) {
      const xRange = [
        Math.min(...trainingData.x) - 1,
        Math.max(...trainingData.x) + 1,
      ]
      const yLine = xRange.map((x) => currentParams.w * x + currentParams.b)

      traces.push({
        x: xRange,
        y: yLine,
        type: 'scatter',
        mode: 'lines',
        name: `y = ${currentParams.w.toFixed(3)}x + ${currentParams.b.toFixed(3)}`,
        line: { color: 'red', width: 2 },
      })
    }

    // Add forecast if available
    if (forecastY.length > 0) {
      const forecastXValues = parseCsvNumbers(forecastX)
      traces.push({
        x: forecastXValues,
        y: forecastY,
        type: 'scatter',
        mode: 'markers',
        name: 'Forecast',
        marker: { size: 10, color: 'green', symbol: 'diamond' },
      })
    }

    return traces
  }, [trainingData, currentParams, forecastY, forecastX])

  // Loss chart data
  const lossPlotData = useMemo(() => {
    if (gdHistory.length === 0) return []

    return [
      {
        x: gdHistory.map((h) => h.epoch),
        y: gdHistory.map((h) => h.loss),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Loss',
        line: { color: 'purple', width: 2 },
      },
    ]
  }, [gdHistory])

  return (
    <main className="p-6 flex justify-center">
      <div className="grid gap-4 max-w-6xl w-full">
        {/* Controls */}
        <div className="grid gap-2">
          <div className="flex gap-3 items-center flex-wrap">
            <button
              onClick={runGradientDescent}
              disabled={!trainingData || isTraining}
              className="px-3.5 py-2.5 rounded-lg cursor-pointer bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Train with Gradient Descent
            </button>
            <button
              onClick={runForecast}
              disabled={
                !session ||
                !meta ||
                !ortApi ||
                !currentParams ||
                status.startsWith('loading') ||
                status.startsWith('creating') ||
                status.startsWith('forecasting') ||
                status.startsWith('Running')
              }
              className="px-3.5 py-2.5 rounded-lg cursor-pointer bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Forecast
            </button>
            <div className="opacity-80 text-sm text-gray-900 dark:text-gray-100">
              Status: <code className="font-mono">{status}</code>
            </div>
            {currentParams && (
              <div className="opacity-80 text-sm text-gray-900 dark:text-gray-100">
                w={currentParams.w.toFixed(4)}, b={currentParams.b.toFixed(4)}
              </div>
            )}
          </div>

          {/* Forecast input */}
          <div>
            <label
              htmlFor="forecast-input"
              className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
            >
              Forecast X Values (comma separated):
            </label>
            <input
              id="forecast-input"
              type="text"
              value={forecastX}
              onChange={(e) => setForecastX(e.target.value)}
              className="w-full p-2 rounded-lg font-mono border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="6, 7, 8, 9, 10"
            />
          </div>
        </div>

        {/* Training Chart */}
        {trainingData && (
          <div className="border border-gray-300 dark:border-gray-600 rounded-2xl p-3">
            {/* @ts-ignore */}
            <Plot
              // @ts-ignore
              data={trainingPlotData as any}
              layout={{
                title: 'Linear Regression: Training Data & Model',
                xaxis: { title: 'X' },
                yaxis: { title: 'Y' },
                autosize: true,
                height: 400,
                margin: { l: 50, r: 20, t: 50, b: 40 },
              }}
              style={{ width: '100%' }}
              useResizeHandler
            />
          </div>
        )}

        {/* Loss Chart */}
        {lossPlotData.length > 0 && (
          <div className="border border-gray-300 dark:border-gray-600 rounded-2xl p-3">
            {/* @ts-ignore */}
            <Plot
              // @ts-ignore
              data={lossPlotData as any}
              layout={{
                title: 'Gradient Descent: Loss Over Time',
                xaxis: { title: 'Epoch' },
                yaxis: { title: 'Loss (MSE)', type: 'log' },
                autosize: true,
                height: 300,
                margin: { l: 50, r: 20, t: 50, b: 40 },
              }}
              style={{ width: '100%' }}
              useResizeHandler
            />
          </div>
        )}

        {/* Training History */}
        {gdHistory.length > 0 && (
          <div className="border border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-800">
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Training History:
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300 dark:border-gray-600">
                    <th className="text-left p-2 text-gray-900 dark:text-gray-100">
                      Epoch
                    </th>
                    <th className="text-left p-2 text-gray-900 dark:text-gray-100">
                      Weight (w)
                    </th>
                    <th className="text-left p-2 text-gray-900 dark:text-gray-100">
                      Bias (b)
                    </th>
                    <th className="text-left p-2 text-gray-900 dark:text-gray-100">
                      Loss
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {gdHistory.map((h, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-200 dark:border-gray-700"
                    >
                      <td className="p-2 font-mono text-gray-900 dark:text-gray-100">
                        {h.epoch}
                      </td>
                      <td className="p-2 font-mono text-gray-900 dark:text-gray-100">
                        {h.w.toFixed(4)}
                      </td>
                      <td className="p-2 font-mono text-gray-900 dark:text-gray-100">
                        {h.b.toFixed(4)}
                      </td>
                      <td className="p-2 font-mono text-gray-900 dark:text-gray-100">
                        {h.loss.toFixed(6)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
