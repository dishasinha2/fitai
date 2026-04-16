const test = require('node:test');
const assert = require('node:assert/strict');

const { dedupeRecommendationsByName } = require('../services/recommendationEngine');

test('dedupeRecommendationsByName keeps only the highest-scoring duplicate ignoring case', () => {
  const input = [
    { name: 'Plank', recommendationScore: 68.2, id: 1 },
    { name: 'Squat', recommendationScore: 71.4, id: 2 },
    { name: 'plank', recommendationScore: 81.1, id: 3 },
    { name: 'PUSH-UP', recommendationScore: 77.6, id: 4 },
    { name: 'Push-Up', recommendationScore: 70.2, id: 5 },
  ];

  const result = dedupeRecommendationsByName(input);

  assert.deepEqual(
    result.map((item) => ({ name: item.name, recommendationScore: item.recommendationScore, id: item.id })),
    [
      { name: 'plank', recommendationScore: 81.1, id: 3 },
      { name: 'PUSH-UP', recommendationScore: 77.6, id: 4 },
      { name: 'Squat', recommendationScore: 71.4, id: 2 },
    ],
  );
});

test('dedupeRecommendationsByName preserves first appearance order when duplicate scores tie', () => {
  const input = [
    { name: 'Burpees', recommendationScore: 65, id: 1 },
    { name: 'Lunges', recommendationScore: 64, id: 2 },
    { name: 'burpees', recommendationScore: 65, id: 3 },
  ];

  const result = dedupeRecommendationsByName(input);

  assert.equal(result.length, 2);
  assert.equal(result[0].id, 1);
  assert.equal(result[1].id, 2);
});
