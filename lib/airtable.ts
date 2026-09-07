type AirtableFields = Record<string, unknown>;

export type AirtableRecord = {
  id: string;
  createdTime: string;
  fields: AirtableFields;
};

type ListOptions = {
  filterByFormula?: string;
  maxRecords?: number;
  sort?: { field: string; direction?: 'asc' | 'desc' }[];
};

const API_ROOT = 'https://api.airtable.com/v0';

function config() {
  const token = process.env.AIRTABLE_PAT;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!token || !baseId) throw new Error('Airtable is not configured');
  return { token, baseId };
}

export function airtableConfigured() {
  return Boolean(process.env.AIRTABLE_PAT && process.env.AIRTABLE_BASE_ID);
}

function pause(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function airtableRequest<T>(table: string, init?: RequestInit, query?: URLSearchParams): Promise<T> {
  const { token, baseId } = config();
  const suffix = query?.toString() ? `?${query}` : '';
  const url = `${API_ROOT}/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}${suffix}`;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...init?.headers,
      },
      cache: 'no-store',
    });

    if (response.status === 429 && attempt === 0) {
      await pause(1100);
      continue;
    }
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Airtable request failed with ${response.status}${detail ? `: ${detail.slice(0, 180)}` : ''}`);
    }
    return response.json() as Promise<T>;
  }

  throw new Error('Airtable request failed');
}

export function formulaEquals(field: string, value: string) {
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `{${field}}="${escaped}"`;
}

export async function listRecords(table: string, options: ListOptions = {}) {
  const query = new URLSearchParams();
  if (options.filterByFormula) query.set('filterByFormula', options.filterByFormula);
  if (options.maxRecords) query.set('maxRecords', String(options.maxRecords));
  options.sort?.forEach((sort, index) => {
    query.set(`sort[${index}][field]`, sort.field);
    query.set(`sort[${index}][direction]`, sort.direction ?? 'asc');
  });
  const response = await airtableRequest<{ records: AirtableRecord[] }>(table, undefined, query);
  return response.records;
}

export async function createRecord(table: string, fields: AirtableFields) {
  const response = await airtableRequest<{ records: AirtableRecord[] }>(table, {
    method: 'POST',
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
  });
  return response.records[0];
}

export async function updateRecord(table: string, id: string, fields: AirtableFields) {
  const response = await airtableRequest<{ records: AirtableRecord[] }>(table, {
    method: 'PATCH',
    body: JSON.stringify({ records: [{ id, fields }], typecast: true }),
  });
  return response.records[0];
}

export async function updateRecords(table: string, records: { id: string; fields: AirtableFields }[]) {
  if (!records.length) return [];
  const saved: AirtableRecord[] = [];
  for (let index = 0; index < records.length; index += 10) {
    const response = await airtableRequest<{ records: AirtableRecord[] }>(table, {
      method: 'PATCH',
      body: JSON.stringify({ records: records.slice(index, index + 10), typecast: true }),
    });
    saved.push(...response.records);
  }
  return saved;
}

export async function findRecord(table: string, field: string, value: string) {
  const records = await listRecords(table, { filterByFormula: formulaEquals(field, value), maxRecords: 1 });
  return records[0] ?? null;
}

export async function upsertRecord(table: string, field: string, value: string, fields: AirtableFields) {
  const current = await findRecord(table, field, value);
  return current ? updateRecord(table, current.id, fields) : createRecord(table, fields);
}
