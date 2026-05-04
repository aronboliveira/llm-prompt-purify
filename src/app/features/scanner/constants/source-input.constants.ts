export const SOURCE_FILE_MAX_BYTES = 1_048_576;

export const SOURCE_FILE_ALLOWED_EXTENSIONS: readonly string[] = Object.freeze([
  ".txt",
  ".log",
  ".env",
]);

export const SOURCE_FILE_ALLOWED_MIME_TYPES: readonly string[] = Object.freeze([
  "text/plain",
  "text/x-log",
  "application/x-log",
  "",
]);

export const SOURCE_FILE_ACCEPT_ATTR = ".txt,.log,.env,text/plain";
