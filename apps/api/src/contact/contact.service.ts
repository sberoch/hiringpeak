import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { companies, contacts, type Contact } from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import type {
  CreateContactServiceDto,
  UpdateContactServiceDto,
} from './contact.dto';

@Injectable()
export class ContactService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async create(dto: CreateContactServiceDto): Promise<Contact> {
    const company = await this.db.query.companies.findFirst({
      columns: { id: true },
      where: and(
        eq(companies.id, dto.companyId),
        eq(companies.organizationId, dto.organizationId),
      ),
    });
    if (!company) throw new BadRequestException('La empresa no existe.');

    const values = {
      organizationId: dto.organizationId,
      companyId: dto.companyId,
      name: dto.name,
      role: dto.role ?? '',
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      linkedin: dto.linkedin ?? null,
      createdBy: dto.createdBy,
    };
    const [contact] = await this.db.insert(contacts).values(values).returning();
    return contact;
  }

  async update(id: number, dto: UpdateContactServiceDto): Promise<Contact> {
    const { organizationId, ...fields } = dto;
    const [contact] = await this.db
      .update(contacts)
      .set({ ...fields, updatedAt: new Date() } as Partial<Contact>)
      .where(
        and(eq(contacts.id, id), eq(contacts.organizationId, organizationId)),
      )
      .returning();
    if (!contact) throw new NotFoundException('Not found');
    return contact;
  }

  /** Vacancies pointing at the Contact lose their Vacancy Contact (FK set null). */
  async remove(id: number, organizationId: number): Promise<Contact> {
    const [contact] = await this.db
      .delete(contacts)
      .where(
        and(eq(contacts.id, id), eq(contacts.organizationId, organizationId)),
      )
      .returning();
    if (!contact) throw new NotFoundException('Not found');
    return contact;
  }
}
