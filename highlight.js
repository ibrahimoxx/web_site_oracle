// Safe innerHTML usage:
// - Source is el.textContent (HTML-decoded plain text, not raw HTML)
// - All text runs through esc() which escapes &, <, >
// - Only hardcoded <span class="cm-*"> tags are injected (no user-controlled HTML)
// - This file processes static study content only, no user input
(function () {
  var KW = /\b(SELECT|FROM|WHERE|AND|OR|NOT|IN|IS|NULL|LIKE|ORDER|BY|GROUP|HAVING|UNION|DISTINCT|ALL|JOIN|ON|INNER|OUTER|LEFT|RIGHT|FULL|CROSS|NATURAL|CREATE|ALTER|DROP|TRUNCATE|RENAME|INSERT|INTO|UPDATE|SET|DELETE|VALUES|GRANT|REVOKE|WITH|ADMIN|OPTION|COMMIT|ROLLBACK|SAVEPOINT|MERGE|CONNECT|RESOURCE|DBA|SYSBACKUP|SYSDBA|SYSOPER|PUBLIC|SESSION|ANY|USER|ROLE|TABLE|INDEX|VIEW|SEQUENCE|SYNONYM|PROCEDURE|FUNCTION|TRIGGER|PACKAGE|BODY|TYPE|DIRECTORY|DATABASE|TABLESPACE|DATAFILE|CONTROLFILE|SPFILE|PFILE|PROFILE|BACKUP|RESTORE|RECOVER|RESYNC|REGISTER|CATALOG|CONFIGURE|SHOW|LIST|REPORT|CROSSCHECK|ALLOCATE|CHANNEL|RELEASE|RUN|EXECUTE|SCRIPT|FLASHBACK|VERSIONS|BETWEEN|STARTUP|SHUTDOWN|MOUNT|OPEN|NOMOUNT|ABORT|IMMEDIATE|NORMAL|ARCHIVELOG|NOARCHIVELOG|ARCHIVE|LOG|RESETLOGS|NORESETLOGS|INCREMENTAL|LEVEL|CUMULATIVE|COPY|BACKUPSET|COMPRESSED|ENCRYPTION|DECRYPTION|ALGORITHM|RETENTION|POLICY|RECOVERY|WINDOW|REDUNDANCY|OBSOLETE|AUTOBACKUP|OPTIMIZATION|DEVICE|DISK|SBT|PARALLELISM|MAXSETSIZE|CLEAR|PLUGGABLE|SKIP|READONLY|MEMBER|ONLINE|OFFLINE|UNTIL|FORMAT|TAG|IDENTIFIED|DEFAULT|QUOTA|UNLIMITED|TEMPORARY|CASCADE|CONSTRAINTS|OBJECT|PRIMARY|KEY|FOREIGN|REFERENCES|UNIQUE|CHECK|ENABLE|DISABLE|ROW|MOVEMENT|RECYCLEBIN|PURGE|BEFORE|GUARANTEE|POINT|SUPPLEMENTAL|DATA|INTERVAL|HOUR|MINUTE|SECOND|SIZE|AUTOEXTEND|NEXT|MAXSIZE|ADD|MODIFY|COLUMN|GLOBAL|LOCAL|NOLOGGING|LOGGING|COMPRESS|NOCOMPRESS|TO_DATE|TO_TIMESTAMP|TO_CHAR|NVL|DECODE|CASE|WHEN|THEN|ELSE|END|SYSDATE|SYSTIMESTAMP|HEXTORAW|AS|OF|SCN|TIMESTAMP|PLUS|CURRENT|VALIDATE|STRUCTURE|NEWNAME|SWITCH|USING|AVAILABLE|EXPIRED|LIMIT|SESSIONS_PER_USER|CPU_PER_SESSION|CONNECT_TIME|IDLE_TIME|PRIVATE_SGA|LOGICAL_READS_PER_SESSION|FAILED_LOGIN_ATTEMPTS|PASSWORD_LIFE_TIME|PASSWORD_GRACE_TIME|PASSWORD_REUSE_TIME|PASSWORD_REUSE_MAX|PASSWORD_VERIFY_FUNCTION|PASSWORD_LOCK_TIME|RECOVERY_CATALOG_OWNER|SYSTEM|UNDO|SYSAUX|VARCHAR2|NUMBER|DATE|INTEGER|CHAR|CLOB|BLOB|FLOAT|BOOLEAN|RMAN|TARGET|SQL|PARAMETER|PFILE|DBID|DB_NAME|DB_UNIQUE_NAME|RECOVERY_AREA)\b/gi;

  // esc: HTML-escape plain text before inserting into innerHTML
  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function hlLine(line) {
    var trimmed = line.replace(/^\s+/, '');

    // Full comment line
    if (trimmed.indexOf('--') === 0) {
      return '<span class="cm-c">' + esc(line) + '</span>';
    }

    // Find inline comment position (skip chars inside single-quoted strings)
    var inQ = false, cmtAt = -1;
    for (var i = 0; i < line.length - 1; i++) {
      if (line[i] === "'") { inQ = !inQ; }
      else if (!inQ && line[i] === '-' && line[i + 1] === '-') { cmtAt = i; break; }
    }

    var code = cmtAt >= 0 ? line.slice(0, cmtAt) : line;
    var cmt  = cmtAt >= 0 ? line.slice(cmtAt) : '';

    // Extract string literals with placeholder so keywords inside strings are skipped
    var strs = [];
    code = code.replace(/'(?:[^']|'')*'/g, function (m) {
      strs.push(m);
      return '\x01' + (strs.length - 1) + '\x01';
    });

    // HTML-escape the code (safe before keyword span injection)
    code = esc(code);

    // Inject keyword spans (only safe class attribute, no user content)
    code = code.replace(KW, '<span class="cm-k">$1</span>');

    // Restore string literals, HTML-escaped and wrapped in safe span
    code = code.replace(/\x01(\d+)\x01/g, function (_, i) {
      return '<span class="cm-s">' + esc(strs[+i]) + '</span>';
    });

    return code + (cmt ? '<span class="cm-c">' + esc(cmt) + '</span>' : '');
  }

  document.querySelectorAll('.code-block code').forEach(function (el) {
    var lines = el.textContent.split('\n');
    // innerHTML is safe here: all text is esc()-escaped, only hardcoded spans injected
    el.innerHTML = lines.map(hlLine).join('\n');
  });
})();
