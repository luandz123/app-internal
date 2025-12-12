import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Guard kiểm tra IP whitelist cho check-in/check-out
 *
 * Cấu hình trong .env:
 * - IP_WHITELIST_ENABLED=true/false (bật/tắt kiểm tra IP)
 * - IP_WHITELIST=192.168.1.1,192.168.1.2,10.0.0.0/24 (danh sách IP hoặc CIDR)
 * - ALLOW_LOCALHOST=true/false (cho phép localhost trong development)
 */
@Injectable()
export class IpWhitelistGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const isEnabled = this.configService.get<string>('IP_WHITELIST_ENABLED');

    // Nếu không bật whitelist, cho phép tất cả
    if (isEnabled !== 'true') {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const clientIp = this.getClientIp(request);

    // Cho phép localhost trong development
    const allowLocalhost = this.configService.get<string>('ALLOW_LOCALHOST');
    if (allowLocalhost === 'true' && this.isLocalhost(clientIp)) {
      return true;
    }

    // Lấy danh sách IP whitelist từ config
    const whitelistString =
      this.configService.get<string>('IP_WHITELIST') || '';
    const whitelist = whitelistString
      .split(',')
      .map((ip) => ip.trim())
      .filter((ip) => ip.length > 0);

    if (whitelist.length === 0) {
      throw new ForbiddenException(
        'Không thể check-in/check-out. Vui lòng liên hệ quản trị viên.',
      );
    }

    const isAllowed = whitelist.some((allowedIp) =>
      this.isIpMatch(clientIp, allowedIp),
    );

    if (!isAllowed) {
      throw new ForbiddenException(
        'Bạn không thể check-in/check-out từ địa chỉ IP này. ' +
          'Vui lòng kết nối mạng công ty hoặc liên hệ quản trị viên.',
      );
    }

    return true;
  }

  private getClientIp(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor.split(',')[0];
      return ips.trim();
    }

    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    return request.ip || request.socket.remoteAddress || '';
  }

  private isLocalhost(ip: string): boolean {
    const localhostIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost'];
    return localhostIps.includes(ip);
  }

  private isIpMatch(clientIp: string, pattern: string): boolean {
    const normalizedClientIp = clientIp.replace('::ffff:', '');
    const normalizedPattern = pattern.replace('::ffff:', '');

    if (normalizedClientIp === normalizedPattern) {
      return true;
    }

    if (normalizedPattern.includes('/')) {
      return this.isIpInCidr(normalizedClientIp, normalizedPattern);
    }

    if (normalizedPattern.includes('*')) {
      const regex = new RegExp(
        '^' +
          normalizedPattern.replace(/\./g, '\\.').replace(/\*/g, '\\d+') +
          '$',
      );
      return regex.test(normalizedClientIp);
    }

    return false;
  }

  private isIpInCidr(ip: string, cidr: string): boolean {
    try {
      const [range, bits] = cidr.split('/');
      const mask = parseInt(bits, 10);

      const ipParts = ip.split('.').map((p) => parseInt(p, 10));
      const rangeParts = range.split('.').map((p) => parseInt(p, 10));

      if (ipParts.length !== 4 || rangeParts.length !== 4) {
        return false;
      }

      const ipNum =
        (ipParts[0] << 24) |
        (ipParts[1] << 16) |
        (ipParts[2] << 8) |
        ipParts[3];
      const rangeNum =
        (rangeParts[0] << 24) |
        (rangeParts[1] << 16) |
        (rangeParts[2] << 8) |
        rangeParts[3];
      const maskNum = (-1 << (32 - mask)) >>> 0;

      return (ipNum & maskNum) === (rangeNum & maskNum);
    } catch {
      return false;
    }
  }
}
