/* eslint-disable */
import { and, eq } from 'drizzle-orm';
import {
  candidates,
  candidateAreas,
  candidateIndustries,
  candidateSeniorities,
  candidateFilesRelation,
  comments,
  blacklists,
} from '@workspace/shared/schemas';
import { SeedTx } from './types';

interface CandidateSeed {
  name: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  image: string;
  phone?: string;
  linkedin?: string;
  address?: string;
  shortDescription?: string;
  stars: number;
}

const candidatesList: CandidateSeed[] = [
  {
    name: 'Martín Álvarez',
    email: 'martin.alvarez@example.com',
    gender: 'male',
    dateOfBirth: '1988-03-15',
    image: 'https://randomuser.me/api/portraits/men/1.jpg',
    phone: '+54 11 4555-1001',
    linkedin: 'https://linkedin.com/in/martin-alvarez',
    shortDescription: 'Gerente comercial con 10 años en consumo masivo',
    stars: 4,
  },
  {
    name: 'Lucía Fernández',
    email: 'lucia.fernandez@example.com',
    gender: 'female',
    dateOfBirth: '1992-07-22',
    image: 'https://randomuser.me/api/portraits/women/1.jpg',
    phone: '+54 11 4555-1002',
    shortDescription: 'Analista de finanzas con experiencia en banca',
    stars: 3,
  },
  {
    name: 'Santiago Rodríguez',
    email: 'santiago.rodriguez@example.com',
    gender: 'male',
    dateOfBirth: '1985-11-08',
    image: 'https://randomuser.me/api/portraits/men/2.jpg',
    linkedin: 'https://linkedin.com/in/santiago-rodriguez',
    shortDescription: 'Director de operaciones en industria automotriz',
    stars: 5,
  },
  {
    name: 'Valentina López',
    email: 'valentina.lopez@example.com',
    gender: 'female',
    dateOfBirth: '1990-01-30',
    image: 'https://randomuser.me/api/portraits/women/2.jpg',
    address: 'Palermo, CABA',
    shortDescription: 'Especialista en marketing digital',
    stars: 4,
  },
  {
    name: 'Nicolás García',
    email: 'nicolas.garcia@example.com',
    gender: 'male',
    dateOfBirth: '1987-06-14',
    image: 'https://randomuser.me/api/portraits/men/3.jpg',
    phone: '+54 11 4555-1005',
    linkedin: 'https://linkedin.com/in/nicolas-garcia',
    shortDescription: 'Jefe de logística con foco en supply chain',
    stars: 3,
  },
  {
    name: 'Camila Martínez',
    email: 'camila.martinez@example.com',
    gender: 'female',
    dateOfBirth: '1993-09-03',
    image: 'https://randomuser.me/api/portraits/women/3.jpg',
    shortDescription: 'Abogada corporativa especializada en M&A',
    stars: 2,
  },
  {
    name: 'Facundo Torres',
    email: 'facundo.torres@example.com',
    gender: 'male',
    dateOfBirth: '1991-04-19',
    image: 'https://randomuser.me/api/portraits/men/4.jpg',
    phone: '+54 11 4555-1007',
    address: 'Belgrano, CABA',
    shortDescription: 'Ingeniero de sistemas, experiencia en energía',
    stars: 4,
  },
  {
    name: 'Sofía Romero',
    email: 'sofia.romero@example.com',
    gender: 'female',
    dateOfBirth: '1989-12-25',
    image: 'https://randomuser.me/api/portraits/women/4.jpg',
    linkedin: 'https://linkedin.com/in/sofia-romero',
    shortDescription: 'Directora de RRHH en multinacional',
    stars: 5,
  },
  {
    name: 'Tomás Peralta',
    email: 'tomas.peralta@example.com',
    gender: 'male',
    dateOfBirth: '1986-08-11',
    image: 'https://randomuser.me/api/portraits/men/5.jpg',
    shortDescription: 'CEO de startup fintech',
    stars: 5,
  },
  {
    name: 'Julieta Díaz',
    email: 'julieta.diaz@example.com',
    gender: 'female',
    dateOfBirth: '1994-02-17',
    image: 'https://randomuser.me/api/portraits/women/5.jpg',
    phone: '+54 11 4555-1010',
    shortDescription: 'Analista de compras en retail',
    stars: 2,
  },
  {
    name: 'Agustín Morales',
    email: 'agustin.morales@example.com',
    gender: 'male',
    dateOfBirth: '1984-05-28',
    image: 'https://randomuser.me/api/portraits/men/6.jpg',
    linkedin: 'https://linkedin.com/in/agustin-morales',
    address: 'Recoleta, CABA',
    shortDescription: 'Gerente de planta con background en oil & gas',
    stars: 4,
  },
  {
    name: 'Carolina Gutiérrez',
    email: 'carolina.gutierrez@example.com',
    gender: 'female',
    dateOfBirth: '1991-10-06',
    image: 'https://randomuser.me/api/portraits/women/6.jpg',
    shortDescription: 'Project manager certificada PMP',
    stars: 3,
  },
  {
    name: 'Matías Sánchez',
    email: 'matias.sanchez@example.com',
    gender: 'male',
    dateOfBirth: '1990-07-13',
    image: 'https://randomuser.me/api/portraits/men/7.jpg',
    phone: '+54 11 4555-1013',
    shortDescription: 'Responsable de seguridad e higiene industrial',
    stars: 3,
  },
  {
    name: 'Florencia Acosta',
    email: 'florencia.acosta@example.com',
    gender: 'female',
    dateOfBirth: '1995-03-21',
    image: 'https://randomuser.me/api/portraits/women/7.jpg',
    linkedin: 'https://linkedin.com/in/florencia-acosta',
    shortDescription: 'Asistente ejecutiva bilingüe',
    stars: 2,
  },
  {
    name: 'Ignacio Herrera',
    email: 'ignacio.herrera@example.com',
    gender: 'male',
    dateOfBirth: '1983-11-02',
    image: 'https://randomuser.me/api/portraits/men/8.jpg',
    address: 'Vicente López, GBA',
    shortDescription: 'Director financiero en agro negocios',
    stars: 5,
  },
  {
    name: 'María Paz Vega',
    email: 'mariapaz.vega@example.com',
    gender: 'female',
    dateOfBirth: '1992-06-09',
    image: 'https://randomuser.me/api/portraits/women/8.jpg',
    phone: '+54 11 4555-1016',
    shortDescription: 'Coordinadora de sustentabilidad corporativa',
    stars: 3,
  },
  {
    name: 'Federico Ruiz',
    email: 'federico.ruiz@example.com',
    gender: 'male',
    dateOfBirth: '1988-09-27',
    image: 'https://randomuser.me/api/portraits/men/9.jpg',
    linkedin: 'https://linkedin.com/in/federico-ruiz',
    shortDescription: 'Líder técnico en desarrollo de software',
    stars: 4,
  },
  {
    name: 'Daniela Castro',
    email: 'daniela.castro@example.com',
    gender: 'female',
    dateOfBirth: '1993-01-14',
    image: 'https://randomuser.me/api/portraits/women/9.jpg',
    shortDescription: 'Especialista en relaciones públicas e institucionales',
    stars: 2,
  },
  {
    name: 'Gonzalo Méndez',
    email: 'gonzalo.mendez@example.com',
    gender: 'male',
    dateOfBirth: '1986-04-05',
    image: 'https://randomuser.me/api/portraits/men/10.jpg',
    phone: '+54 11 4555-1019',
    address: 'San Isidro, GBA',
    shortDescription: 'Gerente de mantenimiento industrial',
    stars: 3,
  },
  {
    name: 'Rocío Navarro',
    email: 'rocio.navarro@example.com',
    gender: 'female',
    dateOfBirth: '1994-08-18',
    image: 'https://randomuser.me/api/portraits/women/10.jpg',
    linkedin: 'https://linkedin.com/in/rocio-navarro',
    shortDescription: 'Analista de ecommerce en retail',
    stars: 4,
  },
];

// Indices of candidates that get a blacklist entry
const BLACKLISTED_INDICES = [5, 13];

function pickRoundRobin(map: Map<string, number>, index: number): number {
  const values = [...map.values()];
  return values[index % values.length]!;
}

export async function seedCandidates(
  tx: SeedTx,
  opts: {
    organizationId: number;
    userId: number;
    areaIds: Map<string, number>;
    industryIds: Map<string, number>;
    seniorityIds: Map<string, number>;
    candidateSourceIds: Map<string, number>;
    candidateFileId: number;
  },
) {
  console.log('Seeding candidates...');

  for (let i = 0; i < candidatesList.length; i++) {
    const c = candidatesList[i]!;

    const [existing] = await tx
      .select({ id: candidates.id })
      .from(candidates)
      .where(
        and(
          eq(candidates.name, c.name),
          eq(candidates.organizationId, opts.organizationId),
        ),
      )
      .limit(1);
    if (existing) {
      console.log(`  Candidate "${c.name}" already exists (id=${existing.id}), skipping`);
      continue;
    }

    const [candidate] = await tx
      .insert(candidates)
      .values({
        name: c.name,
        email: c.email,
        gender: c.gender,
        dateOfBirth: new Date(c.dateOfBirth),
        image: c.image,
        phone: c.phone ?? null,
        linkedin: c.linkedin ?? null,
        address: c.address ?? null,
        shortDescription: c.shortDescription ?? null,
        stars: String(c.stars),
        isInCompanyViaPratt: false,
        countries: [],
        provinces: [],
        languages: [],
        sourceId: pickRoundRobin(opts.candidateSourceIds, i),
        organizationId: opts.organizationId,
      } as typeof candidates.$inferInsert)
      .returning({ id: candidates.id });
    if (!candidate) throw new Error(`Candidate insert failed for ${c.name}`);
    console.log(`  Candidate "${c.name}" created (id=${candidate.id})`);

    const areaId = pickRoundRobin(opts.areaIds, i);
    const industryId = pickRoundRobin(opts.industryIds, i);
    const seniorityId = pickRoundRobin(opts.seniorityIds, i);

    await tx.insert(candidateAreas).values({
      candidateId: candidate.id,
      areaId,
    });
    await tx.insert(candidateIndustries).values({
      candidateId: candidate.id,
      industryId,
    });
    await tx.insert(candidateSeniorities).values({
      candidateId: candidate.id,
      seniorityId,
    });
    await tx.insert(candidateFilesRelation).values({
      candidateId: candidate.id,
      fileId: opts.candidateFileId,
    });

    await tx.insert(comments).values({
      organizationId: opts.organizationId,
      candidateId: candidate.id,
      userId: opts.userId,
      comment: `Perfil revisado — ${c.shortDescription ?? c.name}`,
    });

    if (BLACKLISTED_INDICES.includes(i)) {
      await tx.insert(blacklists).values({
        organizationId: opts.organizationId,
        candidateId: candidate.id,
        userId: opts.userId,
        reason: 'No cumple con los requisitos del puesto.',
      });
      console.log(`    Blacklisted "${c.name}"`);
    }
  }
}
