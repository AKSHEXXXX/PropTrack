import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ResponseEnvelope<T> {
  data?: T;
  message?: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  ResponseEnvelope<T> | T
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<ResponseEnvelope<T> | T>,
  ): Observable<{ statusCode: number; message: string; data: T }> {
    const response = context.switchToHttp().getResponse<Response>();
    return next.handle().pipe(
      map((payload) => {
        const maybeEnvelope = payload as ResponseEnvelope<T>;
        const hasEnvelope =
          typeof payload === 'object' &&
          payload !== null &&
          'message' in payload;
        return {
          statusCode: response.statusCode,
          message: hasEnvelope
            ? (maybeEnvelope.message ?? 'Success')
            : 'Success',
          data: hasEnvelope
            ? (maybeEnvelope.data ?? (payload as T))
            : (payload as T),
        };
      }),
    );
  }
}
