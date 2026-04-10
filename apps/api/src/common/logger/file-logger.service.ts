import {
  ConsoleLogger,
  Injectable,
  LogLevel,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWriteStream, mkdirSync, type WriteStream } from 'node:fs';
import { join, resolve } from 'node:path';
import { inspect } from 'node:util';

type ParsedLogPayload = {
  context?: string;
  messages: unknown[];
  stack?: string;
};

type FileLogRecord = {
  context?: string;
  env: string;
  level: LogLevel;
  message: string;
  pid: number;
  stack?: string;
  timestamp: string;
};

@Injectable()
export class FileLogger
  extends ConsoleLogger
  implements OnApplicationShutdown
{
  private readonly envName: string;
  private readonly logsDirectory = resolve(
    __dirname,
    '..',
    '..',
    '..',
    'logs',
  );

  private currentFilePath?: string;
  private stream?: WriteStream;

  constructor(private readonly configService: ConfigService) {
    super({
      colors: true,
    });
    this.envName = this.resolveEnvName();
  }

  override log(message: any, ...optionalParams: [...any, string?]): void {
    super.log(message, ...optionalParams);
    if (!this.isLevelEnabled('log')) {
      return;
    }

    const payload = this.extractContextAndMessages([message, ...optionalParams]);
    this.writeRecords('log', payload);
  }

  override error(
    message: any,
    ...optionalParams: [...any, string?, string?]
  ): void {
    super.error(message, ...optionalParams);
    if (!this.isLevelEnabled('error')) {
      return;
    }

    const payload = this.extractContextStackAndMessages([
      message,
      ...optionalParams,
    ]);
    this.writeRecords('error', payload);
  }

  override warn(message: any, ...optionalParams: [...any, string?]): void {
    super.warn(message, ...optionalParams);
    if (!this.isLevelEnabled('warn')) {
      return;
    }

    const payload = this.extractContextAndMessages([message, ...optionalParams]);
    this.writeRecords('warn', payload);
  }

  override debug(message: any, ...optionalParams: [...any, string?]): void {
    super.debug(message, ...optionalParams);
    if (!this.isLevelEnabled('debug')) {
      return;
    }

    const payload = this.extractContextAndMessages([message, ...optionalParams]);
    this.writeRecords('debug', payload);
  }

  override verbose(message: any, ...optionalParams: [...any, string?]): void {
    super.verbose(message, ...optionalParams);
    if (!this.isLevelEnabled('verbose')) {
      return;
    }

    const payload = this.extractContextAndMessages([message, ...optionalParams]);
    this.writeRecords('verbose', payload);
  }

  override fatal(message: any, ...optionalParams: [...any, string?]): void {
    super.fatal(message, ...optionalParams);
    if (!this.isLevelEnabled('fatal')) {
      return;
    }

    const payload = this.extractContextAndMessages([message, ...optionalParams]);
    this.writeRecords('fatal', payload);
  }

  onApplicationShutdown(): void {
    this.closeStream();
  }

  private writeRecords(level: LogLevel, payload: ParsedLogPayload): void {
    for (const message of payload.messages) {
      this.writeLine({
        context: payload.context,
        env: this.envName,
        level,
        message: this.serializeMessage(message),
        pid: process.pid,
        stack: payload.stack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private writeLine(record: FileLogRecord): void {
    try {
      const stream = this.ensureStream();
      stream.write(`${JSON.stringify(record)}\n`);
    } catch (error) {
      const fallbackMessage =
        error instanceof Error ? error.stack ?? error.message : String(error);
      process.stderr.write(
        `[FileLogger] Failed to write log entry: ${fallbackMessage}\n`,
      );
    }
  }

  private ensureStream(now = new Date()): WriteStream {
    const filePath = join(
      this.logsDirectory,
      `${this.getDateKey(now)}-${this.envName}.log`,
    );

    if (this.stream && this.currentFilePath === filePath) {
      return this.stream;
    }

    this.closeStream();
    mkdirSync(this.logsDirectory, { recursive: true });

    const stream = createWriteStream(filePath, { flags: 'a' });
    stream.on('error', (error) => {
      const message = error.stack ?? error.message;
      process.stderr.write(`[FileLogger] Stream error: ${message}\n`);
    });

    this.currentFilePath = filePath;
    this.stream = stream;
    return stream;
  }

  private closeStream(): void {
    this.stream?.end();
    this.stream = undefined;
    this.currentFilePath = undefined;
  }

  private resolveEnvName(): string {
    const configuredEnv =
      this.configService.get<string>('APP_ENV')?.trim() ||
      this.configService.get<string>('NODE_ENV')?.trim();

    if (configuredEnv) {
      return this.sanitizeEnvName(configuredEnv);
    }

    const productionFlag = this.configService.get<string>('PRODUCTION')?.trim();
    if (productionFlag === 'true') {
      return 'production';
    }

    return 'development';
  }

  private sanitizeEnvName(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  }

  private getDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private serializeMessage(message: unknown): string {
    if (typeof message === 'function') {
      return this.serializeMessage(message.name || message.toString());
    }

    if (message instanceof Error) {
      return message.stack ?? `${message.name}: ${message.message}`;
    }

    if (typeof message === 'string') {
      return message;
    }

    return inspect(message, {
      breakLength: Infinity,
      colors: false,
      compact: true,
      depth: 5,
      sorted: true,
    });
  }

  private extractContextAndMessages(args: unknown[]): ParsedLogPayload {
    if (args.length <= 1) {
      return { context: this.context, messages: args };
    }

    const lastElement = args[args.length - 1];
    if (typeof lastElement !== 'string') {
      return { context: this.context, messages: args };
    }

    return {
      context: lastElement,
      messages: args.slice(0, args.length - 1),
    };
  }

  private extractContextStackAndMessages(
    args: unknown[],
  ): ParsedLogPayload {
    if (args.length === 2) {
      if (this.looksLikeStack(args[1])) {
        return {
          context: this.context,
          messages: [args[0]],
          stack: args[1],
        };
      }

      return {
        context: typeof args[1] === 'string' ? args[1] : this.context,
        messages: [args[0]],
      };
    }

    const payload = this.extractContextAndMessages(args);
    if (payload.messages.length <= 1) {
      return payload;
    }

    const lastElement = payload.messages[payload.messages.length - 1];
    if (typeof lastElement !== 'string' && typeof lastElement !== 'undefined') {
      return payload;
    }

    return {
      context: payload.context,
      messages: payload.messages.slice(0, payload.messages.length - 1),
      stack: lastElement,
    };
  }

  private looksLikeStack(value: unknown): value is string {
    if (typeof value !== 'string') {
      return false;
    }

    return /^(.)+\n\s+at .+:\d+:\d+/.test(value);
  }
}
