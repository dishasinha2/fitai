const express = require('express');
const { execFile } = require('child_process');
const path = require('path');
const authMiddleware = require('../middleware/auth');
const { optionalAuthMiddleware } = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { getModelStatus } = require('../services/mlRecommendationEngine');
const { getUserById } = require('../db');

const router = express.Router();
const PYTHON_BIN = process.env.PYTHON_BIN || 'python';

const runPythonScript = (scriptName) =>
  new Promise((resolve, reject) => {
    execFile(
      PYTHON_BIN,
      [path.join(__dirname, '..', 'ml', scriptName)],
      { cwd: path.join(__dirname, '..') },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
          return;
        }

        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
        });
      },
    );
  });

router.get('/status', optionalAuthMiddleware, (req, res) => {
  const status = getModelStatus();
  const user = req.user?.id ? getUserById(req.user.id) : null;
  const isAdmin = Boolean(user && user.role === 'admin');

  res.json({
    ok: true,
    summary: status.model_trained
      ? 'Model artifact is available and FitAI recommendations are using trained ML data.'
      : 'Model artifact is missing or untrained. Run npm run ml:build to train the recommender.',
    access: isAdmin ? 'admin' : 'public',
    retrain_available: isAdmin,
    next_step: status.model_trained
      ? 'Open dashboard or workout page to verify live Fit Score and ML confidence values.'
      : 'Run npm run ml:build from backend, then restart the backend server.',
    checks: {
      artifact_exists: status.artifact_exists,
      dataset_loaded: status.dataset_size > 0,
      model_trained: status.model_trained,
      hierarchical_enabled: status.hierarchical_enabled,
    },
    ...status,
  });
});

router.post('/retrain', authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const datasetResult = await runPythonScript('build_training_dataset.py');
    const trainResult = await runPythonScript('train_recommender.py');

    res.json({
      success: true,
      dataset: datasetResult.stdout ? JSON.parse(datasetResult.stdout) : null,
      train: trainResult.stdout ? JSON.parse(trainResult.stdout) : null,
      status: getModelStatus(),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
