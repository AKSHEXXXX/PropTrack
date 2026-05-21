import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const authBypassEnabled =
      process.env.AUTH_DISABLED === 'true' &&
      process.env.NODE_ENV !== 'test' &&
      process.env.JEST_WORKER_ID === undefined;

    if (authBypassEnabled) {
      return true;
    }

    return super.canActivate(context);
  }
}
