import { describe, it, expect } from 'vitest';
import { generateUUID } from '../utils/uuid';

describe('generateUUID', () => {
  it('generates a valid UUID format', () => {
    const uuid = generateUUID();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuid).toMatch(uuidRegex);
  });

  it('generates unique UUIDs', () => {
    const uuid1 = generateUUID();
    const uuid2 = generateUUID();
    expect(uuid1).not.toBe(uuid2);
  });

  it('generates UUIDs that are strings with correct length', () => {
    const uuid = generateUUID();
    expect(typeof uuid).toBe('string');
    expect(uuid.length).toBe(36); // Standard UUID length
    expect(uuid.split('-').length).toBe(5); // Standard UUID structure
  });
});