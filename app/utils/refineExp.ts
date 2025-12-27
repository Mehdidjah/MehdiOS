export function refineExp(exp: string): string {
  return exp.replace(/×/g, '*').replace(/÷/g, '/')
}
