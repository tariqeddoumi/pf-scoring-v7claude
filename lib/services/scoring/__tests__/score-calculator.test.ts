import { ScoreCalculator, AggregationEngine } from "../score-calculator";

describe("ScoreCalculator", () => {
  test("scoreFromOptions matches option value to score", () => {
    const options = [
      { value: "yes", score: 100 },
      { value: "no", score: 0 },
    ];

    const result = ScoreCalculator.scoreFromOptions("yes", options);
    expect(result.rawScore).toBe(100);
  });

  test("scoreFromOptions returns 0 for no match", () => {
    const options = [
      { value: "yes", score: 100 },
      { value: "no", score: 0 },
    ];

    const result = ScoreCalculator.scoreFromOptions("maybe", options);
    expect(result.rawScore).toBe(0);
  });

  test("scoreFromRanges matches numeric value to range", () => {
    const ranges = [
      { min: 0, max: 50, score: 20 },
      { min: 50, max: 100, score: 80 },
    ];

    const result = ScoreCalculator.scoreFromRanges(75, ranges);
    expect(result.rawScore).toBe(80);
  });

  test("scoreFromRanges returns 0 for value outside ranges", () => {
    const ranges = [
      { min: 0, max: 50, score: 20 },
      { min: 50, max: 100, score: 80 },
    ];

    const result = ScoreCalculator.scoreFromRanges(150, ranges);
    expect(result.rawScore).toBe(0);
  });

  test("scoreFromFormula evaluates math expression", () => {
    const result = ScoreCalculator.scoreFromFormula("(revenue / expenses) * 100", {
      revenue: 1000,
      expenses: 800,
    });

    expect(result.rawScore).toBe(125);
  });

  test("scoreFromFormula handles formula errors gracefully", () => {
    const result = ScoreCalculator.scoreFromFormula(
      "revenue / 0",
      { revenue: 1000 },
      50
    );

    expect(result.rawScore).toBe(50);
  });

  test("score routes to options method", () => {
    const result = ScoreCalculator.score({
      answer: "yes",
      options: [{ value: "yes", score: 100 }],
    });

    expect(result.rawScore).toBe(100);
  });

  test("score routes to ranges method", () => {
    const result = ScoreCalculator.score({
      answer: 75,
      ranges: [{ min: 50, max: 100, score: 80 }],
    });

    expect(result.rawScore).toBe(80);
  });
});

describe("AggregationEngine", () => {
  test("aggregate SUM adds all scores", () => {
    const children = [
      { nodeId: "c1", rawScore: 10, weight: 1 },
      { nodeId: "c2", rawScore: 20, weight: 1 },
    ];

    const result = AggregationEngine.aggregate("SUM", children as any);
    expect(result).toBe(30);
  });

  test("aggregate WEIGHTED_SUM applies weights", () => {
    const children = [
      { nodeId: "c1", rawScore: 10, weight: 2 },
      { nodeId: "c2", rawScore: 20, weight: 1 },
    ];

    const result = AggregationEngine.aggregate("WEIGHTED_SUM", children as any);
    expect(result).toBe(10 * 2 + 20 * 1); // 40
  });

  test("aggregate AVERAGE divides by count", () => {
    const children = [
      { nodeId: "c1", rawScore: 10, weight: 1 },
      { nodeId: "c2", rawScore: 20, weight: 1 },
    ];

    const result = AggregationEngine.aggregate("AVERAGE", children as any);
    expect(result).toBe(15);
  });

  test("aggregate WEIGHTED_AVERAGE applies weights", () => {
    const children = [
      { nodeId: "c1", rawScore: 10, weight: 2 },
      { nodeId: "c2", rawScore: 20, weight: 1 },
    ];

    const result = AggregationEngine.aggregate("WEIGHTED_AVERAGE", children as any);
    expect(result).toBeCloseTo((10 * 2 + 20 * 1) / (2 + 1)); // 13.33
  });

  test("normalize scales score to [0,1]", () => {
    const result = AggregationEngine.normalize(50, 100);
    expect(result).toBe(0.5);

    const result2 = AggregationEngine.normalize(100, 100);
    expect(result2).toBe(1);

    const result3 = AggregationEngine.normalize(0, 100);
    expect(result3).toBe(0);
  });

  test("normalize clamps out-of-range values", () => {
    const result = AggregationEngine.normalize(150, 100);
    expect(result).toBe(1);

    const result2 = AggregationEngine.normalize(-50, 100);
    expect(result2).toBe(0);
  });
});
