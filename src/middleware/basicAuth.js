const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Protected"');
    return res.status(401).send('Authentication required');
  }

  const [scheme, credentials] = authHeader.split(' ');

  if (scheme !== 'Basic' || !credentials) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Protected"');
    return res.status(401).send('Authentication required');
  }

  const decodedCredentials = Buffer.from(credentials, 'base64').toString();
  const separatorIndex = decodedCredentials.indexOf(':');

  if (separatorIndex === -1) {
    return res.status(403).send('Forbidden');
  }

  const user = decodedCredentials.slice(0, separatorIndex);
  const pass = decodedCredentials.slice(separatorIndex + 1);

  if (user === process.env.AUTH_USER && pass === process.env.AUTH_PASS) {
    return next();
  }

  return res.status(403).send('Forbidden');
};

export default auth;
