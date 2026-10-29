export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    field?: string;
    details?: Record<string, unknown>;
    request_id?: string;
    doc_url?: string;
  };
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly field?: string;
  public readonly details?: Record<string, unknown>;
  public readonly docUrl?: string;

  constructor(options: {
    statusCode: number;
    code: string;
    message: string;
    field?: string;
    details?: Record<string, unknown>;
    docUrl?: string;
  }) {
    super(options.message);
    this.name = "AppError";
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.field = options.field;
    this.details = options.details;
    this.docUrl = options.docUrl;
  }
}
