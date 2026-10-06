import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const databasePathFromEnv =
  process.env.E2E_DATABASE_PATH;

if (!databasePathFromEnv) {
  throw new Error(
    'Brak wymaganej zmiennej środowiskowej E2E_DATABASE_PATH'
  );
}

const databasePath: string =
  databasePathFromEnv;

if (!existsSync(databasePath)) {
  throw new Error(
    `Baza danych nie istnieje: ${databasePath}`
  );
}

export type TestTransaction = {
  transactionId: number;
  importBatchId: number;
};

type CreateTestTransactionOptions = {
  description: string;
  accountName?: string;
  amount?: number;
};

function openDatabase(): DatabaseSync {
  const db = new DatabaseSync(databasePath);

  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA busy_timeout = 5000');

  return db;
}

export function createTestTransaction({
  description,
  accountName = 'ROR-B',
  amount = -50,
}: CreateTestTransactionOptions): TestTransaction {
  const db = openDatabase();

  try {
    const account = db
      .prepare(`
        SELECT id
        FROM accounts
        WHERE name = ?
      `)
      .get(accountName) as
      | { id: number }
      | undefined;

    if (!account) {
      throw new Error(
        `Nie znaleziono konta testowego: ${accountName}`
      );
    }

    const uniqueSuffix =
      `${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 10)}`;

    const date = new Date()
      .toISOString()
      .slice(0, 10);

    db.exec('BEGIN');

    try {
      const importBatchResult = db
        .prepare(`
          INSERT INTO import_batches (
            account_id,
            filename,
            file_hash,
            status,
            error_message
          )
          VALUES (?, ?, ?, ?, ?)
        `)
        .run(
          account.id,
          `e2e_${uniqueSuffix}.pdf`,
          `e2e_hash_${uniqueSuffix}`,
          'success',
          null
        );

      const importBatchId = Number(
        importBatchResult.lastInsertRowid
      );

      const transactionResult = db
        .prepare(`
          INSERT INTO transactions (
            account_id,
            booking_date,
            operation_date,
            operation_type,
            description,
            amount,
            balance_after,
            currency,
            category_id,
            import_batch_id,
            is_duplicate
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          account.id,
          date,
          date,
          'E2E TEST',
          description,
          amount,
          1000,
          'PLN',
          null,
          importBatchId,
          0
        );

      const transactionId = Number(
        transactionResult.lastInsertRowid
      );

      db.exec('COMMIT');

      return {
        transactionId,
        importBatchId,
      };
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  } finally {
    db.close();
  }
}

export function deleteTestTransaction(
  testTransaction: TestTransaction
): void {
  const db = openDatabase();

  try {
    db.exec('BEGIN');

    try {
      db
        .prepare(`
          DELETE FROM transactions
          WHERE id = ?
        `)
        .run(testTransaction.transactionId);

      db
        .prepare(`
          DELETE FROM import_batches
          WHERE id = ?
        `)
        .run(testTransaction.importBatchId);

      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  } finally {
    db.close();
  }
}