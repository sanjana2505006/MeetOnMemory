import React, { useCallback, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
// Assuming TailwindCSS is available for styling based on package.json
import {
  buildSentimentChartData,
  formatTimestamp,
  getSegmentIndexFromChartClick,
} from "../utils/sentimentNavigation";

const CustomTooltip = ({ active, payload, isNavigable }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isPositive = data.sentimentScore >= 0;

    return (
      <div className="bg-white p-3 border rounded shadow-md dark:bg-gray-800 dark:border-gray-700">
        <p className="font-semibold text-gray-800 dark:text-gray-200">
          Time: {formatTimestamp(data.startTime)} -{" "}
          {formatTimestamp(data.endTime)}
        </p>
        <p
          className={`text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}
        >
          Sentiment Score: {data.sentimentScore.toFixed(2)}
        </p>
        {data.emotionTags && data.emotionTags.length > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Emotion:{" "}
            <span className="font-medium">{data.emotionTags.join(", ")}</span>
          </p>
        )}
        <p className="text-xs text-gray-500 mt-2 italic max-w-xs truncate">
          "{data.text}"
        </p>
        {isNavigable && (
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-medium">
            Click to open this moment in the transcript
          </p>
        )}
      </div>
    );
  }

  return null;
};

const MeetingSentimentChart = ({ transcript, onSelectSegment }) => {
  const chartData = useMemo(
    () => buildSentimentChartData(transcript),
    [transcript],
  );

  const isNavigable = typeof onSelectSegment === "function";

  const handleChartClick = useCallback(
    (chartState) => {
      if (!isNavigable) return;

      const segmentIndex = getSegmentIndexFromChartClick(chartData, chartState);
      if (segmentIndex !== null) onSelectSegment(segmentIndex);
    },
    [chartData, isNavigable, onSelectSegment],
  );

  if (!chartData || chartData.length === 0) {
    return (
      <div className="p-4 bg-gray-50 text-gray-500 rounded-md text-center italic border border-gray-100">
        Sentiment data is currently processing or unavailable for this meeting.
      </div>
    );
  }

  // Calculate overall sentiment to show in header
  const overallSentiment = transcript.overallSentiment || 0;
  const isOverallPositive = overallSentiment >= 0;

  // Create gradient ID
  const gradientId = "colorSentiment";

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-5 mb-6">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Emotional Timeline
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Meeting sentiment arc over time
          </p>
          {isNavigable && (
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
              Click any point to jump to that moment in the transcript
            </p>
          )}
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
            Overall Mood
          </span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${isOverallPositive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
          >
            {transcript.overallEmotion ||
              (isOverallPositive ? "POSITIVE" : "NEGATIVE")}
          </span>
        </div>
      </div>

      <div className={`h-64 w-full ${isNavigable ? "cursor-pointer" : ""}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            onClick={handleChartClick}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e5e7eb"
            />
            <XAxis
              dataKey="displayTime"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              minTickGap={30}
            />
            <YAxis
              domain={[-1, 1]}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip isNavigable={isNavigable} />} />
            <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="sentimentScore"
              stroke="#8b5cf6"
              strokeWidth={3}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
              activeDot={{
                r: isNavigable ? 7 : 6,
                strokeWidth: isNavigable ? 2 : 0,
                stroke: "#ffffff",
                fill: "#8b5cf6",
                style: isNavigable ? { cursor: "pointer" } : undefined,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MeetingSentimentChart;
