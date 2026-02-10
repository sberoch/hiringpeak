import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const GoogleLoginSchema = z.object({
  id_token: z.string().min(1),
});

export class GoogleLoginDto extends createZodDto(GoogleLoginSchema) {
  id_token!: string;
}
