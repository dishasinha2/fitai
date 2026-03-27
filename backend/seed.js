const mongoose = require('mongoose');
const Exercise = require('./models/Exercise');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fitai';

const exercises = [
  {
    name: 'Bodyweight Squats',
    category: 'strength',
    equipment: 'none',
    location: 'home',
    intensity: 'moderate',
    muscleGroup: 'legs',
    youtubeId: 'aclHkVaku9U',
    instructions: 'Keep your chest up, hips back, and knees tracking over toes.',
    tags: ['beginner', 'no-equipment'],
  },
  {
    name: 'Push-ups',
    category: 'strength',
    equipment: 'none',
    location: 'both',
    intensity: 'moderate',
    muscleGroup: 'chest',
    youtubeId: 'IODxDxX7oi4',
    instructions: 'Brace your core and lower your chest under control.',
    tags: ['beginner', 'upper-body'],
  },
  {
    name: 'Mountain Climbers',
    category: 'conditioning',
    equipment: 'none',
    location: 'home',
    intensity: 'high',
    muscleGroup: 'core',
    youtubeId: 'nmwgirgXLYM',
    instructions: 'Drive knees forward quickly while keeping hips steady.',
    tags: ['fat-loss', 'home'],
  },
  {
    name: 'Plank',
    category: 'core',
    equipment: 'none',
    location: 'both',
    intensity: 'low',
    muscleGroup: 'core',
    youtubeId: 'pSHjTRCQxIw',
    instructions: 'Keep a straight line from shoulders to heels.',
    tags: ['stability', 'beginner'],
  },
  {
    name: 'Bench Press',
    category: 'strength',
    equipment: 'barbell',
    location: 'gym',
    intensity: 'high',
    muscleGroup: 'chest',
    youtubeId: 'gRVjAtPip0Y',
    instructions: 'Plant your feet firmly and press the bar in a controlled path.',
    tags: ['muscle-gain', 'gym'],
  },
  {
    name: 'Lat Pulldown',
    category: 'strength',
    equipment: 'machine',
    location: 'gym',
    intensity: 'moderate',
    muscleGroup: 'back',
    youtubeId: 'CAwf7n6Luuc',
    instructions: 'Pull elbows down and back while keeping your chest lifted.',
    tags: ['gym', 'back'],
  },
  {
    name: 'Treadmill Intervals',
    category: 'cardio',
    equipment: 'treadmill',
    location: 'gym',
    intensity: 'high',
    muscleGroup: 'full_body',
    youtubeId: 'hCDzSR6bW10',
    instructions: 'Alternate brisk recovery and fast intervals.',
    tags: ['fat-loss', 'cardio'],
  },
  {
    name: 'Mobility Flow',
    category: 'mobility',
    equipment: 'none',
    location: 'both',
    intensity: 'low',
    muscleGroup: 'full_body',
    youtubeId: '4BOTvaRaDjI',
    instructions: 'Move slowly through shoulder, hip, and spine ranges.',
    tags: ['warmup', 'recovery'],
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  await Exercise.deleteMany({});
  await Exercise.insertMany(exercises);
  console.log('Seeded FitAI exercises');
  await mongoose.connection.close();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
