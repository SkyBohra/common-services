// custom-decorators.ts
import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;
        return data ? user?.[data] : user;
    },
);

export const Pagination = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 10;
        const skip = (page - 1) * limit;
        return { page, limit, skip };
    },
);

export const RealIP = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.headers['x-forwarded-for']?.split(',')[0] ||
            request.headers['x-real-ip'] ||
            request.connection.remoteAddress ||
            request.ip;
    },
);

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);