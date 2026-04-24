'use client';

import { X } from 'lucide-react';
import { ComposeForm } from './compose-form';
import type { SendCampaignResult } from '@/lib/recruitment-comms-api';

export function SingleApplicantMessageModal({
  applicationId,
  applicantEmail,
  smsAvailable,
  onClose,
  onSent,
}: {
  applicationId: string;
  applicantEmail: string;
  smsAvailable: boolean;
  onClose: () => void;
  onSent: (result: SendCampaignResult) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-primary-dark">Message Applicant</h2>
            <p className="text-xs text-text-muted">
              {applicationId} · {applicantEmail}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-text-muted hover:text-primary-dark"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <ComposeForm
          exerciseId={null}
          fixedApplicationId={applicationId}
          smsAvailable={smsAvailable}
          onSent={(r) => {
            onSent(r);
            onClose();
          }}
        />
      </div>
    </div>
  );
}
