
const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

const connectionString = 'postgresql://neondb_owner:npg_5EjkBWfPe4Mb@ep-fancy-shadow-a47es9gw-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(connectionString);

function splitSqlStatements(sqlContent) {
  const statements = [];
  let currentStatement = '';
  let inSingleQuote = false;
  let inDollarQuote = false;
  let dollarQuoteTag = '';

  for (let i = 0; i < sqlContent.length; i++) {
    const char = sqlContent[i];
    const nextChar = sqlContent[i + 1];

    if (inSingleQuote) {
      currentStatement += char;
      if (char === "'" && sqlContent[i - 1] !== '\\') { // Simple check for escaped quote
        // Note: SQL escapes single quote with another single quote usually, but let's keep it simple
        // If we see '', it's an escape. 
        if (nextChar === "'") {
          currentStatement += nextChar;
          i++;
        } else {
          inSingleQuote = false;
        }
      }
    } else if (inDollarQuote) {
      currentStatement += char;
      // Check for end of dollar quote
      if (char === '$') {
        // We need to check if we matched the tag. 
        // This is a simplified check assuming $$ or $tag$
        // For now, let's just check for $$ as that's what is used in the scripts
        if (dollarQuoteTag === '$$') {
          if (sqlContent[i - 1] === '$') {
            inDollarQuote = false;
            dollarQuoteTag = '';
          }
        }
        // TODO: handle named tags if needed, but the scripts use $$
      }
    } else {
      // Normal mode
      if (char === "'") {
        inSingleQuote = true;
        currentStatement += char;
      } else if (char === '$' && nextChar === '$') {
        inDollarQuote = true;
        dollarQuoteTag = '$$';
        currentStatement += char + nextChar;
        i++;
      } else if (char === ';') {
        // End of statement
        if (currentStatement.trim().length > 0) {
          statements.push(currentStatement.trim());
        }
        currentStatement = '';
      } else {
        currentStatement += char;
      }
    }
  }

  if (currentStatement.trim().length > 0) {
    statements.push(currentStatement.trim());
  }

  return statements;
}

async function runScript(filename) {
  console.log(`Running ${filename}...`);
  const filePath = path.join(__dirname, filename);
  const content = fs.readFileSync(filePath, 'utf8');

  const statements = splitSqlStatements(content);

  try {
    for (const statement of statements) {
      try {
        // The neon driver expects a tagged template literal. 
        // We can simulate this by passing a mock TemplateStringsArray.
        const strings = [statement];
        strings.raw = [statement];
        await sql(strings);
      } catch (e) {
        if (e.code === '42710') { // duplicate_object
          console.log(`Skipping duplicate type creation: ${statement.substring(0, 30)}...`);
          continue;
        }
        if (e.code === '42P07') { // duplicate_table
          console.log(`Skipping duplicate table creation: ${statement.substring(0, 30)}...`);
          continue;
        }
        console.error(`Error running statement: ${statement.substring(0, 50)}...`);
        throw e;
      }
    }
    console.log(`Successfully ran ${filename}`);
  } catch (e) {
    console.error(`Error running ${filename}:`, e);
    process.exit(1);
  }
}

async function main() {
  try {
    await runScript('001_create_schema.sql');
    await runScript('002_seed_data.sql');
    await runScript('006_seed_with_api_key.sql');
    console.log('All scripts executed successfully.');
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  }
}

main();
