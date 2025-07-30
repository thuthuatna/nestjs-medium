export enum PostgresErrorCode {
  UniqueViolation = '23505',
  ForeignKeyViolation = '23503',
  NotNullViolation = '23502',
  CheckViolation = '23514',
  DataException = '22000',
  InvalidTextRepresentation = '22P02',
  SyntaxError = '42601',
  InsufficientPrivilege = '42501',
  UndefinedTable = '42P01',
  UndefinedColumn = '42703',
  DuplicateColumn = '42701',
  InvalidParameterValue = '22023',
}
