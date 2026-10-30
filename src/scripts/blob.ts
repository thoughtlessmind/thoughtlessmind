// A liquid blob's outline: a closed Catmull-Rom curve through its rim points, as SVG path data. The footer name's
// blob and the theme switch's pour both draw with it (DESIGN.md §4).
export function loop(p: [number, number][]): string {
  const N = p.length;
  const f = (n: number) => n.toFixed(1);
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 0; i < N; i++) {
    const [p0, p1, p2, p3] = [p[(i + N - 1) % N], p[i], p[(i + 1) % N], p[(i + 2) % N]];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + 'Z';
}
