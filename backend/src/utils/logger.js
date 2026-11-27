const logger = {
  info(message, meta) {
    const ts = new Date().toISOString();
    if (meta) {
      console.log(`[${ts}] INFO  ${message}`, JSON.stringify(meta));
    } else {
      console.log(`[${ts}] INFO  ${message}`);
    }
  },
  warn(message, meta) {
    const ts = new Date().toISOString();
    if (meta) {
      console.warn(`[${ts}] WARN  ${message}`, JSON.stringify(meta));
    } else {
      console.warn(`[${ts}] WARN  ${message}`);
    }
  },
  error(message, meta) {
    const ts = new Date().toISOString();
    if (meta) {
      console.error(`[${ts}] ERROR ${message}`, meta);
    } else {
      console.error(`[${ts}] ERROR ${message}`);
    }
  },
};

module.exports = logger;
