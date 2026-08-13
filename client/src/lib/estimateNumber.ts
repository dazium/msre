export type EstimateNumberRecord = {
  estimateNumber?: string | null;
};

const ESTIMATE_NUMBER_PATTERN = /^EST-(\d+)$/i;

/**
 * Returns the next sequential estimate number using the existing EST-### format.
 * Non-matching legacy numbers are ignored rather than replaced.
 */
export function getNextEstimateNumber(estimates: EstimateNumberRecord[]): string {
  const highestNumber = estimates.reduce((highest, estimate) => {
    const match = estimate.estimateNumber?.trim().match(ESTIMATE_NUMBER_PATTERN);
    if (!match) return highest;

    const parsed = Number.parseInt(match[1], 10);
    return Number.isFinite(parsed) ? Math.max(highest, parsed) : highest;
  }, 0);

  return `EST-${String(highestNumber + 1).padStart(3, "0")}`;
}

export function isEstimateNumber(value: string): boolean {
  return ESTIMATE_NUMBER_PATTERN.test(value.trim());
}
