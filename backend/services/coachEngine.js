const buildCoachCheckIn = ({
  user,
  summary,
  rewards,
  reminders = [],
  adherence,
  recommendation,
}) => {
  const goalLabel = user.fitnessGoal.replace('_', ' ');
  const latestFocus = recommendation?.nextExercise?.name || 'your next session';
  const completedMeals = adherence?.completedToday?.length || 0;
  const totalMeals = adherence?.plan?.meals?.length || 0;
  const adherenceRate = adherence?.completionRate || 0;

  const actions = [
    `Train for at least ${user.preferences?.sessionDuration || 45} minutes focused on ${latestFocus}.`,
    `Hit ${adherenceRate}% or more diet adherence today${totalMeals ? ` by completing ${Math.max(0, totalMeals - completedMeals)} more meal checks` : ''}.`,
    `Protect your streak by logging one quality session${rewards?.streak ? ` and extending it to ${rewards.streak + 1} days` : ''}.`,
  ];

  if (reminders.length) {
    actions.push(`You have ${reminders.length} active reminder${reminders.length === 1 ? '' : 's'} helping today's routine.`);
  }

  return {
    headline: `Today we are pushing ${goalLabel} with precision.`,
    summary: `FitAI sees ${summary.totalWorkouts || 0} workouts logged, a ${summary.consistencyScore || 0}% consistency score, and ${rewards?.points || 0} reward points so far.`,
    motivation:
      user.location === 'home'
        ? 'Your home setup is enough. Consistency matters more than equipment.'
        : 'Use the gym environment for intent, not noise. One focused session beats random volume.',
    recoveryNote:
      summary.bestWorkoutDuration > 60
        ? 'You have been putting in longer sessions lately. Prioritize sleep and hydration today.'
        : 'Session load looks sustainable. Keep recovery habits steady and stay sharp for the next block.',
    actions: actions.slice(0, 4),
    source: 'rule-based',
  };
};

const answerCoachQuestion = ({ question = '', user, summary, adherence, rewards, recommendation }) => {
  const normalized = question.toLowerCase();
  const fallback = `Stay aligned with your ${user.fitnessGoal.replace('_', ' ')} goal, protect your ${rewards.streak || 0}-day streak, and use ${recommendation?.nextExercise?.name || 'your next recommendation'} as today's opener.`;

  if (normalized.includes('diet') || normalized.includes('meal') || normalized.includes('nutrition')) {
    return {
      reply: `Nutrition should support ${user.fitnessGoal.replace('_', ' ')} right now. You are at ${adherence?.completionRate || 0}% adherence today, so focus on finishing the next planned meal and hitting protein first.`,
      actionItems: ['Complete the next meal in your diet plan.', 'Keep hydration on target.', 'Avoid skipping protein-rich meals after training.'],
      source: 'rule-based',
    };
  }

  if (normalized.includes('recover') || normalized.includes('rest') || normalized.includes('sleep')) {
    return {
      reply: `Recovery looks best when your training remains consistent without excessive session length. Your current average session duration is ${summary.averageWorkoutDuration || 0} minutes, so aim for quality sleep and controlled intensity tomorrow.`,
      actionItems: ['Sleep on time tonight.', 'Use lighter mobility if sore.', 'Keep tomorrow warm-up longer than usual.'],
      source: 'rule-based',
    };
  }

  if (normalized.includes('progress') || normalized.includes('plateau') || normalized.includes('improve')) {
    return {
      reply: `Your dashboard shows ${summary.totalWorkouts || 0} completed workouts and a ${summary.consistencyScore || 0}% consistency score. Improvement will come fastest from repeating your best weekly habits, not changing everything at once.`,
      actionItems: ['Repeat your strongest training time slot this week.', 'Track one more progress log.', 'Push one core lift or movement with intent.'],
      source: 'rule-based',
    };
  }

  if (normalized.includes('workout') || normalized.includes('train') || normalized.includes('exercise')) {
    return {
      reply: `For today's training, open with ${recommendation?.nextExercise?.name || 'your first recommended move'} and keep the session focused on ${recommendation?.focus || 'balanced progress'}. That keeps you aligned with your ${user.fitnessGoal.replace('_', ' ')} target.`,
      actionItems: ['Start the workout from the dashboard.', 'Use guidance video for the first key move.', 'Finish by logging the session immediately.'],
      source: 'rule-based',
    };
  }

  return {
    reply: fallback,
    actionItems: ['Follow today recommendation.', 'Stay on plan with meals.', 'Log progress and rewards before ending the day.'],
    source: 'rule-based',
  };
};

module.exports = {
  buildCoachCheckIn,
  answerCoachQuestion,
};
