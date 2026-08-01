// Helpers that map points on the sentiment chart back to their transcript
// segment. The chart only plots segments that carry a sentiment score, so its
// own indexes cannot be used to address `transcript.segments` directly.

export const formatTimestamp = (seconds) => {
  const totalSeconds = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Builds the sentiment chart series, keeping each point's position in the
 * original `transcript.segments` array as `segmentIndex`.
 */
export const buildSentimentChartData = (transcript) => {
  const segments = transcript?.segments;
  if (!Array.isArray(segments)) return [];

  return segments
    .map((segment, segmentIndex) => ({
      ...segment,
      segmentIndex,
      displayTime: formatTimestamp(segment?.startTime),
    }))
    .filter((point) => typeof point.sentimentScore === "number");
};

/**
 * Resolves the clicked chart point to a transcript segment index.
 *
 * @param {Array} chartData series produced by `buildSentimentChartData`
 * @param {object} chartState recharts click state (`activeTooltipIndex`)
 * @returns {number|null} index into `transcript.segments`, or null if the click
 *   did not land on a data point
 */
export const getSegmentIndexFromChartClick = (chartData, chartState) => {
  if (!Array.isArray(chartData) || !chartState) return null;

  const activeIndex = chartState.activeTooltipIndex ?? chartState.activeIndex;
  if (activeIndex === null || activeIndex === undefined || activeIndex === "") {
    return null;
  }

  const chartIndex = Number(activeIndex);
  if (
    !Number.isInteger(chartIndex) ||
    chartIndex < 0 ||
    chartIndex >= chartData.length
  ) {
    return null;
  }

  const { segmentIndex } = chartData[chartIndex] || {};
  return Number.isInteger(segmentIndex) ? segmentIndex : null;
};

/**
 * Finds a segment's index in the transcript. Segments fetched from a separate
 * endpoint are different object instances, so they are matched by id first and
 * by start time plus text as a fallback.
 */
export const findSegmentIndex = (segments, target) => {
  if (!Array.isArray(segments) || !target) return -1;

  if (target._id) {
    const byId = segments.findIndex(
      (segment) => segment?._id && String(segment._id) === String(target._id),
    );
    if (byId !== -1) return byId;
  }

  return segments.findIndex(
    (segment) =>
      segment?.startTime === target.startTime && segment?.text === target.text,
  );
};
