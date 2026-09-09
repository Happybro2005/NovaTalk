const SUBJECT_KEYWORDS: Record<string, string[]> = {
  DSA: ['array', 'tree', 'graph', 'sorting', 'algorithm', 'linked list', 'stack', 'queue', 'recursion', 'dynamic programming', 'binary search', 'heap', 'hash'],
  DBMS: ['sql', 'database', 'normalization', 'transaction', 'query', 'schema', 'index', 'join', 'acid', 'er diagram', 'relational'],
  'Operating Systems': ['process', 'thread', 'scheduling', 'memory', 'deadlock', 'kernel', 'paging', 'semaphore', 'mutex', 'cpu'],
  Networks: ['tcp', 'udp', 'ip', 'routing', 'protocol', 'dns', 'http', 'socket', 'osi', 'bandwidth', 'firewall'],
  'Machine Learning': ['neural', 'model', 'training', 'dataset', 'regression', 'classification', 'gradient', 'tensorflow', 'pytorch', 'overfitting'],
  Calculus: ['derivative', 'integral', 'limit', 'differentiation', 'integration', 'calculus', 'matrix', 'vector', 'probability'],
}

export function categorizeDoubt(text: string): { category: string; confidence: number } {
  const normalized = text.toLowerCase()
  let bestCategory = 'General'
  let bestScore = 0

  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    const matches = keywords.filter((keyword) => normalized.includes(keyword)).length
    if (matches > bestScore) {
      bestScore = matches
      bestCategory = subject
    }
  }

  const confidence = bestScore === 0 ? 0.3 : Math.min(0.95, 0.4 + bestScore * 0.15)
  return { category: bestCategory, confidence }
}
