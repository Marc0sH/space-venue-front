import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { UnsavedChangesDialogService } from '../common/unsaved-changes-dialog';
import { formularioGuard } from './formulario-guard';

describe('formularioGuard', () => {
  const confirm = vi.fn();

  beforeEach(() => {
    confirm.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: UnsavedChangesDialogService, useValue: { confirm } }],
    });
  });

  it('allows leaving when the component has no unsaved changes', () => {
    const result = TestBed.runInInjectionContext(() =>
      formularioGuard({ hasUnsavedChanges: () => false }, null!, null!, null!),
    );

    expect(result).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('asks for confirmation when the component has unsaved changes', async () => {
    confirm.mockResolvedValue(false);
    const result = TestBed.runInInjectionContext(() =>
      formularioGuard({ hasUnsavedChanges: () => true }, null!, null!, null!),
    );

    await expect(result).resolves.toBe(false);
    expect(confirm).toHaveBeenCalledOnce();
  });
});
