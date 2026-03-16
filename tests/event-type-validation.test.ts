/**
 * Tests for event_type normalization and validation.
 */
import { describe, it, expect } from 'vitest';
import { resolveEventType, ValidationError } from '../src';

describe('resolveEventType', () => {
  // --- Dot-notation strings passthrough ---

  it('passes through "message.in"', () => {
    expect(resolveEventType('message.in')).toBe('message.in');
  });

  it('passes through "message.out"', () => {
    expect(resolveEventType('message.out')).toBe('message.out');
  });

  it('passes through "tool.call"', () => {
    expect(resolveEventType('tool.call')).toBe('tool.call');
  });

  it('passes through "tool.result"', () => {
    expect(resolveEventType('tool.result')).toBe('tool.result');
  });

  it('passes through "system"', () => {
    expect(resolveEventType('system')).toBe('system');
  });

  // --- Uppercase enum name normalization ---

  it('normalizes "MESSAGE_IN" to "message.in"', () => {
    expect(resolveEventType('MESSAGE_IN')).toBe('message.in');
  });

  it('normalizes "MESSAGE_OUT" to "message.out"', () => {
    expect(resolveEventType('MESSAGE_OUT')).toBe('message.out');
  });

  it('normalizes "TOOL_CALL" to "tool.call"', () => {
    expect(resolveEventType('TOOL_CALL')).toBe('tool.call');
  });

  it('normalizes "TOOL_RESULT" to "tool.result"', () => {
    expect(resolveEventType('TOOL_RESULT')).toBe('tool.result');
  });

  it('normalizes "SYSTEM" to "system"', () => {
    expect(resolveEventType('SYSTEM')).toBe('system');
  });

  // --- Case-insensitive normalization ---

  it('normalizes mixed case "Tool_Call"', () => {
    expect(resolveEventType('Tool_Call')).toBe('tool.call');
  });

  it('normalizes lowercase "message_in"', () => {
    expect(resolveEventType('message_in')).toBe('message.in');
  });

  // --- Invalid strings ---

  it('throws ValidationError for invalid string', () => {
    expect(() => resolveEventType('invalid')).toThrow(ValidationError);
    expect(() => resolveEventType('invalid')).toThrow("Invalid eventType 'invalid'");
  });

  it('throws ValidationError for empty string', () => {
    expect(() => resolveEventType('')).toThrow(ValidationError);
  });

  it('throws ValidationError for partial match', () => {
    expect(() => resolveEventType('TOOL_CALL_EXTRA')).toThrow(ValidationError);
  });

  it('includes valid values in error message', () => {
    try {
      resolveEventType('bad');
    } catch (error) {
      expect((error as Error).message).toContain('message.in');
      expect((error as Error).message).toContain('tool.call');
      return;
    }
    throw new Error('Expected ValidationError');
  });

  it('includes hint in error message', () => {
    try {
      resolveEventType('nope');
    } catch (error) {
      expect((error as Error).message).toContain('Hint');
      return;
    }
    throw new Error('Expected ValidationError');
  });
});
