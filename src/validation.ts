export class ValidationError extends Error {
}

export function validate(result: boolean, message?: string) {
  if (result) {
    return;
  }
  throw new ValidationError(message || "Value is not true");
}