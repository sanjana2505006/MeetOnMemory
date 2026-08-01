import { describe, it, expect } from "vitest";
import {
  buildSentimentChartData,
  findSegmentIndex,
  formatTimestamp,
  getSegmentIndexFromChartClick,
} from "../sentimentNavigation.js";

const segment = (overrides = {}) => ({
  text: "hello",
  speaker: "Speaker 1",
  startTime: 0,
  endTime: 5,
  sentimentScore: 0.5,
  emotionTags: ["POSITIVE"],
  ...overrides,
});

describe("formatTimestamp", () => {
  it("formats seconds as mm:ss", () => {
    expect(formatTimestamp(0)).toBe("00:00");
    expect(formatTimestamp(65)).toBe("01:05");
    expect(formatTimestamp(3661)).toBe("61:01");
  });

  it("falls back to zero for missing or negative values", () => {
    expect(formatTimestamp(undefined)).toBe("00:00");
    expect(formatTimestamp(-30)).toBe("00:00");
  });
});

describe("buildSentimentChartData", () => {
  it("keeps each point's position in the original segment list", () => {
    const transcript = {
      segments: [
        segment({ startTime: 0, sentimentScore: 0.4 }),
        segment({ startTime: 30, sentimentScore: undefined }),
        segment({ startTime: 90, sentimentScore: -0.2 }),
      ],
    };

    const chartData = buildSentimentChartData(transcript);

    expect(chartData).toHaveLength(2);
    expect(chartData.map((point) => point.segmentIndex)).toEqual([0, 2]);
    expect(chartData[1].displayTime).toBe("01:30");
  });

  it("returns an empty series when there is no transcript or no segments", () => {
    expect(buildSentimentChartData(null)).toEqual([]);
    expect(buildSentimentChartData({})).toEqual([]);
    expect(buildSentimentChartData({ segments: "nope" })).toEqual([]);
  });
});

describe("getSegmentIndexFromChartClick", () => {
  const chartData = [
    { segmentIndex: 0 },
    { segmentIndex: 2 },
    { segmentIndex: 5 },
  ];

  it("maps the clicked chart index onto the transcript segment index", () => {
    expect(
      getSegmentIndexFromChartClick(chartData, { activeTooltipIndex: 1 }),
    ).toBe(2);
    expect(
      getSegmentIndexFromChartClick(chartData, { activeTooltipIndex: 2 }),
    ).toBe(5);
  });

  it("accepts the index as a string, as recharts may report it", () => {
    expect(
      getSegmentIndexFromChartClick(chartData, { activeTooltipIndex: "1" }),
    ).toBe(2);
  });

  it("falls back to activeIndex", () => {
    expect(getSegmentIndexFromChartClick(chartData, { activeIndex: 0 })).toBe(
      0,
    );
  });

  it("returns null for clicks that miss a data point", () => {
    expect(getSegmentIndexFromChartClick(chartData, null)).toBeNull();
    expect(getSegmentIndexFromChartClick(chartData, {})).toBeNull();
    expect(
      getSegmentIndexFromChartClick(chartData, { activeTooltipIndex: null }),
    ).toBeNull();
    expect(
      getSegmentIndexFromChartClick(chartData, { activeTooltipIndex: "" }),
    ).toBeNull();
  });

  it("returns null for out of range or malformed indexes", () => {
    expect(
      getSegmentIndexFromChartClick(chartData, { activeTooltipIndex: 3 }),
    ).toBeNull();
    expect(
      getSegmentIndexFromChartClick(chartData, { activeTooltipIndex: -1 }),
    ).toBeNull();
    expect(
      getSegmentIndexFromChartClick(chartData, { activeTooltipIndex: "abc" }),
    ).toBeNull();
    expect(
      getSegmentIndexFromChartClick([{}], { activeTooltipIndex: 0 }),
    ).toBeNull();
  });

  it("works end to end with a filtered series", () => {
    const transcript = {
      segments: [
        segment({ sentimentScore: undefined }),
        segment({ sentimentScore: 0.9 }),
      ],
    };
    const series = buildSentimentChartData(transcript);

    expect(
      getSegmentIndexFromChartClick(series, { activeTooltipIndex: 0 }),
    ).toBe(1);
  });
});

describe("findSegmentIndex", () => {
  const segments = [
    segment({ _id: "a", startTime: 0, text: "first" }),
    segment({ _id: "b", startTime: 12, text: "second" }),
  ];

  it("matches on id", () => {
    expect(findSegmentIndex(segments, { _id: "b" })).toBe(1);
  });

  it("falls back to start time and text when the id is missing", () => {
    expect(findSegmentIndex(segments, { startTime: 12, text: "second" })).toBe(
      1,
    );
  });

  it("returns -1 when nothing matches", () => {
    expect(findSegmentIndex(segments, { _id: "z", text: "nope" })).toBe(-1);
    expect(findSegmentIndex(null, { _id: "a" })).toBe(-1);
    expect(findSegmentIndex(segments, null)).toBe(-1);
  });
});
