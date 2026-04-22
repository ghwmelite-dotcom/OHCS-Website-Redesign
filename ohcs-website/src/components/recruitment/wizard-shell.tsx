'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout, type SaveDraftInput } from '@/lib/applicant-api';
import { useAutoSave } from '@/lib/use-auto-save';
import type { Application, ApplicationFormData } from '@/types/recruitment';
import { StepPersonal } from './step-personal';
import { StepEligibility } from './step-eligibility';
import { StepEducation } from './step-education';
import { StepDocumentsStub } from './step-documents-stub';
import { StepReview } from './step-review';

/* ------------------------------------------------------------------ */
/*  AutoSave context — avoids prop-drilling `schedule` to step forms.  */
/* ------------------------------------------------------------------ */
interface AutoSaveContextValue {
  schedule: (patch: SaveDraftInput) => void;
}

const AutoSaveContext = createContext<AutoSaveContextValue | null>(null);

export function useAutoSaveSchedule(): (patch: SaveDraftInput) => void {
  const ctx = useContext(AutoSaveContext);
  if (!ctx) {
    throw new Error(
      'useAutoSaveSchedule must be used inside a WizardShell <AutoSaveContext.Provider>',
    );
  }
  return ctx.schedule;
}

/* ------------------------------------------------------------------ */
/*  Step metadata                                                      */
/* ------------------------------------------------------------------ */
const STEP_TITLES: Record<number, string> = {
  1: 'Personal Details',
  2: 'Eligibility',
  3: 'Education & Experience',
  4: 'Documents (Coming in Phase 3)',
  5: 'Review & Submit',
};

const SUBMIT_DISABLED_TOOLTIP =
  'Document uploads coming in Phase 3 — submission unlocks then.';

/* ------------------------------------------------------------------ */
/*  Working-copy state — survives step switches before autosave fires. */
/* ------------------------------------------------------------------ */
interface WizardShellProps {
  application: Application;
  step: number;
  onStepChange: (next: number) => void;
}

interface WorkingState {
  formData: ApplicationFormData;
  has_professional_qualification: boolean;
  is_pwd: boolean;
}

export function WizardShell({ application, step, onStepChange }: WizardShellProps) {
  const router = useRouter();
  const autoSave = useAutoSave();

  // Local working copy — initialised from the loaded draft.
  const [working, setWorking] = useState<WorkingState>(() => ({
    formData: { ...application.form_data },
    has_professional_qualification: application.has_professional_qualification,
    is_pwd: application.is_pwd,
  }));

  // Re-base when the upstream application reference changes (e.g. retry/refetch).
  useEffect(() => {
    setWorking({
      formData: { ...application.form_data },
      has_professional_qualification: application.has_professional_qualification,
      is_pwd: application.is_pwd,
    });
  }, [application]);

  /* ── Derived: form change handler used by step components ─────── */
  const handleFormChange = useCallback(
    (patch: Partial<ApplicationFormData>) => {
      setWorking((prev) => ({
        ...prev,
        formData: { ...prev.formData, ...patch },
      }));
      autoSave.schedule({ form_patch: patch });
    },
    [autoSave],
  );

  const handleFlagChange = useCallback(
    (flag: 'has_professional_qualification' | 'is_pwd', value: boolean) => {
      setWorking((prev) => ({ ...prev, [flag]: value }));
      autoSave.schedule({ [flag]: value });
    },
    [autoSave],
  );

  /* ── Logout ─────────────────────────────────────────────────────── */
  const [loggingOut, setLoggingOut] = useState(false);
  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await autoSave.flush();
      await logout();
    } catch {
      // Best-effort logout — proceed regardless of network errors.
    } finally {
      router.push('/services/recruitment/');
    }
  }, [autoSave, router]);

  /* ── Navigation ─────────────────────────────────────────────────── */
  const [eligibilityWarning, setEligibilityWarning] = useState(false);

  const goToStep = useCallback(
    async (next: number) => {
      if (next < 1 || next > 5) return;
      await autoSave.flush();
      setEligibilityWarning(false);
      onStepChange(next);
    },
    [autoSave, onStepChange],
  );

  const handleNext = useCallback(async () => {
    // Gentle gate on Step 2 → must hold a first degree.
    if (step === 2 && working.formData.holds_first_degree !== true) {
      setEligibilityWarning(true);
      return;
    }
    await goToStep(step + 1);
  }, [step, working.formData.holds_first_degree, goToStep]);

  const handlePrevious = useCallback(async () => {
    await goToStep(step - 1);
  }, [step, goToStep]);

  /* ── Save indicator: refresh "Xs ago" every 5s ──────────────────── */
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    if (autoSave.state.status !== 'saved' || autoSave.state.lastSavedAt === null) {
      return undefined;
    }
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, [autoSave.state.status, autoSave.state.lastSavedAt]);

  const savedAgoLabel = useMemo(() => {
    if (autoSave.state.status !== 'saved' || autoSave.state.lastSavedAt === null) {
      return null;
    }
    const seconds = Math.max(0, Math.floor((now - autoSave.state.lastSavedAt) / 1000));
    if (seconds < 5) return 'Saved just now';
    if (seconds < 60) return `Saved ${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Saved ${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `Saved ${hours}h ago`;
  }, [autoSave.state.status, autoSave.state.lastSavedAt, now]);

  const retrySave = useCallback(() => {
    void autoSave.flush();
  }, [autoSave]);

  /* ── Active step body ───────────────────────────────────────────── */
  const stepTitle = STEP_TITLES[step] ?? '';
  const progressPct = Math.max(0, Math.min(100, step * 20));

  function renderStepBody() {
    switch (step) {
      case 1:
        return (
          <StepPersonal
            application={application}
            data={working.formData}
            onChange={handleFormChange}
          />
        );
      case 2:
        return (
          <StepEligibility
            data={working.formData}
            hasProfessionalQualification={working.has_professional_qualification}
            isPwd={working.is_pwd}
            onChange={handleFormChange}
            onFlagChange={handleFlagChange}
            showRequiredWarning={eligibilityWarning}
          />
        );
      case 3:
        return <StepEducation data={working.formData} onChange={handleFormChange} />;
      case 4:
        return <StepDocumentsStub />;
      case 5:
        return (
          <StepReview
            application={application}
            data={working.formData}
            hasProfessionalQualification={working.has_professional_qualification}
            isPwd={working.is_pwd}
          />
        );
      default:
        return null;
    }
  }

  const autoSaveValue = useMemo<AutoSaveContextValue>(
    () => ({ schedule: autoSave.schedule }),
    [autoSave.schedule],
  );

  return (
    <AutoSaveContext.Provider value={autoSaveValue}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Top bar */}
        <header className="bg-white border-b-2 border-border/40 sticky top-0 z-30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            {/* Progress bar (kente-styled gradient) */}
            <div
              className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden mb-3"
              role="progressbar"
              aria-label={`Application progress: step ${step} of 5`}
              aria-valuenow={step}
              aria-valuemin={1}
              aria-valuemax={5}
            >
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-primary to-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Step {step} of 5
                </p>
                <h1 className="text-base sm:text-lg font-bold text-primary-dark truncate">
                  {stepTitle}
                </h1>
              </div>

              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={loggingOut}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-text-muted hover:text-primary-dark hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                {loggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>

            {/* Save indicator */}
            <div className="mt-2 min-h-[1.25rem] flex items-center text-xs">
              {autoSave.state.status === 'saving' && (
                <span className="inline-flex items-center gap-1.5 text-text-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Saving…
                </span>
              )}
              {autoSave.state.status === 'saved' && savedAgoLabel && (
                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  {savedAgoLabel}
                </span>
              )}
              {autoSave.state.status === 'error' && (
                <button
                  type="button"
                  onClick={retrySave}
                  className="inline-flex items-center gap-1.5 text-red-700 hover:text-red-800 font-medium"
                  title={autoSave.state.error ?? 'Save failed'}
                >
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  Save failed — retry
                </button>
              )}
              {/* Idle state intentionally renders nothing */}
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <div className="bg-white rounded-2xl border-2 border-border/40 p-6 sm:p-8 shadow-sm">
              {renderStepBody()}
            </div>
          </div>
        </main>

        {/* Bottom nav bar */}
        <footer className="bg-white border-t-2 border-border/40 sticky bottom-0 z-30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => void handlePrevious()}
                className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-border/60 text-sm font-semibold text-primary-dark rounded-xl hover:border-primary hover:text-primary transition-colors"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Previous
              </button>
            ) : (
              <span aria-hidden="true" />
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={() => void handleNext()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                disabled
                title={SUBMIT_DISABLED_TOOLTIP}
                aria-label={`Submit Application — ${SUBMIT_DISABLED_TOOLTIP}`}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl',
                  'bg-gray-200 text-text-muted cursor-not-allowed opacity-70',
                )}
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                Submit Application
              </button>
            )}
          </div>
        </footer>
      </div>
    </AutoSaveContext.Provider>
  );
}
