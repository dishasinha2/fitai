const jwt = require('jsonwebtoken');
const { createAuthAttemptLog } = require('../db');

const parseCookies = (cookieHeader = '') =>
  String(cookieHeader || '')
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((accumulator, part) => {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();
      accumulator[key] = decodeURIComponent(value);
      return accumulator;
    }, {});

const getAuthDebugHelp = (req) => {
  const host = req.get('host') || 'localhost:5001';
  const protocol = req.protocol || 'http';
  const samplePath = req.originalUrl?.split('?')[0] || '/api/auth/me';
  return {
    loginEndpoint: `${protocol}://${host}/api/auth/login`,
    exampleUrl: `${protocol}://${host}${samplePath}?token=YOUR_JWT`,
    documentation: 'README.md#api-endpoints',
  };
};

const logAuthenticationAttempt = (req, outcome, details = {}) => {
  try {
    createAuthAttemptLog({
      userId: req.user?.id || null,
      endpoint: req.originalUrl?.split('?')[0] || req.path || 'unknown',
      outcome,
      tokenSource: req.authState?.tokenSource || 'none',
      ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || '',
      userAgent: req.header('User-Agent') || '',
      details,
    });
  } catch (_error) {
    // Keep auth middleware resilient even if logging fails.
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(
      `[fitai-auth] ${outcome} | ${req.method} ${req.originalUrl} | source=${req.authState?.tokenSource || 'none'}`,
    );
  }
};

const extractToken = (req) => {
  const authHeader = req.headers.authorization || req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return {
      token: authHeader.substring(7),
      source: 'authorization_header',
    };
  }

  if (req.query?.token) {
    return {
      token: String(req.query.token),
      source: 'query_param',
    };
  }

  const cookies = req.cookies || parseCookies(req.header('Cookie'));
  if (cookies?.token) {
    return {
      token: String(cookies.token),
      source: 'cookie',
    };
  }

  return {
    token: null,
    source: 'none',
  };
};

const getDevelopmentTestUser = (req, source) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const defaultDevToken = process.env.DEV_TEST_TOKEN || 'fitai-dev-token';
  const { token } = extractToken(req);
  if (!token || token !== defaultDevToken) {
    return null;
  }

  return {
    id: String(req.query?.devUserId || process.env.DEV_TEST_USER_ID || '1'),
    role: String(process.env.DEV_TEST_USER_ROLE || 'admin'),
    email: process.env.DEV_TEST_USER_EMAIL || 'dev@fitai.local',
    devTestToken: true,
    source,
  };
};

const verifyToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET || 'secret', {
    issuer: 'fitai',
    audience: 'fitai-web',
  });

const authMiddleware = (req, res, next) => {
  const { token, source } = extractToken(req);
  req.authState = {
    authenticated: false,
    tokenSource: source,
    outcome: 'missing_token',
  };

  if (!token) {
    logAuthenticationAttempt(req, 'missing_token', getAuthDebugHelp(req));
    return res.status(401).json({
      error: 'Access denied. Missing token.',
      help: {
        message: 'Get a JWT by calling the login endpoint, then retry with Authorization header, ?token=YOUR_JWT, or token cookie.',
        ...getAuthDebugHelp(req),
      },
    });
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    req.authState = {
      authenticated: true,
      tokenSource: source,
      outcome: 'authenticated',
    };
    logAuthenticationAttempt(req, 'authenticated');
    return next();
  } catch (error) {
    const devUser = getDevelopmentTestUser(req, source);
    if (devUser) {
      req.user = devUser;
      req.authState = {
        authenticated: true,
        tokenSource: source,
        outcome: 'development_test_token',
      };
      logAuthenticationAttempt(req, 'development_test_token', { enabled: true });
      return next();
    }

    req.authState = {
      authenticated: false,
      tokenSource: source,
      outcome: 'invalid_token',
    };
    logAuthenticationAttempt(req, 'invalid_token', { reason: error.message, ...getAuthDebugHelp(req) });
    return res.status(401).json({
      error: 'Invalid token.',
      help: {
        message: 'Sign in again to get a fresh JWT token, then retry with Authorization header, ?token=YOUR_JWT, or token cookie.',
        ...getAuthDebugHelp(req),
      },
    });
  }
};

const optionalAuthMiddleware = (req, _res, next) => {
  const { token, source } = extractToken(req);

  if (!token) {
    req.user = null;
    req.authState = {
      authenticated: false,
      tokenSource: source,
      outcome: 'public_preview',
    };
    logAuthenticationAttempt(req, 'public_preview');
    return next();
  }

  try {
    req.user = verifyToken(token);
    req.authState = {
      authenticated: true,
      tokenSource: source,
      outcome: 'authenticated',
    };
    logAuthenticationAttempt(req, 'authenticated');
  } catch (error) {
    const devUser = getDevelopmentTestUser(req, source);
    if (devUser) {
      req.user = devUser;
      req.authState = {
        authenticated: true,
        tokenSource: source,
        outcome: 'development_test_token',
      };
      logAuthenticationAttempt(req, 'development_test_token', { enabled: true });
      return next();
    }

    req.user = null;
    req.authState = {
      authenticated: false,
      tokenSource: source,
      outcome: 'invalid_token',
    };
    logAuthenticationAttempt(req, 'invalid_token', { reason: error.message, ...getAuthDebugHelp(req) });
  }

  return next();
};

module.exports = authMiddleware;
module.exports.optionalAuthMiddleware = optionalAuthMiddleware;
module.exports.extractToken = extractToken;
