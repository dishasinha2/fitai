const axios = require('axios');

const extractTextFromResponse = (responseData) => {
  if (typeof responseData?.output_text === 'string' && responseData.output_text.trim()) {
    return responseData.output_text.trim();
  }

  const outputs = responseData?.output || [];
  const textParts = [];
  outputs.forEach((item) => {
    if (item?.type !== 'message' || !Array.isArray(item.content)) {
      return;
    }

    item.content.forEach((contentItem) => {
      if (contentItem?.type === 'output_text' && contentItem.text) {
        textParts.push(contentItem.text);
      }
    });
  });

  return textParts.join('\n').trim();
};

const buildCoachContextText = ({ user, summary, rewards, reminders, adherence, recommendation, question, mode }) =>
  [
    `Mode: ${mode}`,
    `Question: ${question || 'Daily coaching check-in'}`,
    `User name: ${user.name}`,
    `Goal: ${user.fitnessGoal}`,
    `Activity level: ${user.activityLevel}`,
    `Workout location: ${user.location}`,
    `Preferred workout days per week: ${user.preferences?.workoutDaysPerWeek || 3}`,
    `Preferred session duration: ${user.preferences?.sessionDuration || 45}`,
    `Total workouts: ${summary.totalWorkouts || 0}`,
    `Consistency score: ${summary.consistencyScore || 0}`,
    `Average workout duration: ${summary.averageWorkoutDuration || 0}`,
    `Reward points: ${rewards?.points || 0}`,
    `Current streak estimate: ${rewards?.streak || 0}`,
    `Active reminders: ${reminders?.length || 0}`,
    `Diet adherence today: ${adherence?.completionRate || 0}`,
    `Diet adherence this week: ${adherence?.weeklyCompletionRate || 0}`,
    `Next recommended exercise: ${recommendation?.nextExercise?.name || 'none'}`,
    `Recommendation focus: ${recommendation?.focus || 'balanced'}`,
  ].join('\n');

const requestCoachCompletion = async ({ contextText, mode }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
  const instructions =
    mode === 'check-in'
      ? 'You are FitAI Coach. Return valid JSON with keys headline, summary, motivation, recoveryNote, actions. actions must be an array of 3 to 4 short actionable strings. Keep every claim grounded in the provided metrics only.'
      : 'You are FitAI Coach. Return valid JSON with keys reply and actionItems. actionItems must be an array of 2 to 4 short actionable strings. Keep every claim grounded in the provided metrics only.';

  const response = await axios.post(
    'https://api.openai.com/v1/responses',
    {
      model,
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: instructions }],
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: contextText }],
        },
      ],
      max_output_tokens: 450,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    },
  );

  const text = extractTextFromResponse(response.data);
  const parsed = JSON.parse(text);

  return {
    ...parsed,
    source: 'llm',
    model,
  };
};

const tryLlmCoachCheckIn = async (context) => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return requestCoachCompletion({
    contextText: buildCoachContextText({ ...context, mode: 'check-in' }),
    mode: 'check-in',
  });
};

const tryLlmCoachAnswer = async ({ question, ...context }) => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return requestCoachCompletion({
    contextText: buildCoachContextText({ ...context, question, mode: 'ask' }),
    mode: 'ask',
  });
};

module.exports = {
  tryLlmCoachCheckIn,
  tryLlmCoachAnswer,
};
