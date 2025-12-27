import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code } = body

    if (typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Invalid code format', console: '' },
        { status: 400 }
      )
    }

    let consoleOutput = ''
    const originalConsoleLog = console.log

    console.log = (...args) => {
      consoleOutput += args.join(' ') + '\n'
      originalConsoleLog(...args)
    }

    let result: unknown
    try {
      result = eval(code)
    } catch (error) {
      result = error instanceof Error ? error.message : String(error)
    } finally {
      console.log = originalConsoleLog
    }

    return NextResponse.json({
      console: consoleOutput.trim() || '',
      error: result
        ? typeof result === 'string'
          ? result
          : 'Sorry, We are unable to run this code'
        : '',
    })
  } catch {
    return NextResponse.json(
      { error: 'Invalid request', console: '' },
      { status: 400 }
    )
  }
}
