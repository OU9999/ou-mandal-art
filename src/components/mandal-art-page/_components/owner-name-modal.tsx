import { useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { useOwnerNameContext } from "../_hooks/owner-name-context";

interface OwnerNameModalFormProps {
  initialName: string;
  isFirstTime: boolean;
}

const OwnerNameModalForm = ({ initialName, isFirstTime }: OwnerNameModalFormProps) => {
  const { save, closePrompt } = useOwnerNameContext();
  const [draft, setDraft] = useState(initialName);

  const trimmed = draft.trim();
  const canSubmit = trimmed.length > 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    save(draft);
  };

  const handleBackdropClick = () => {
    if (isFirstTime) return;
    closePrompt();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape") return;
    if (isFirstTime) return;
    closePrompt();
  };

  return (
    <div
      className="owner-modal-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <form
        className="owner-modal"
        onClick={(event) => event.stopPropagation()}
        onSubmit={submit}
        aria-label="이름 입력"
      >
        <header className="owner-modal-header">
          <span className="owner-modal-eyebrow">Mandal-Art</span>
          <h2 className="owner-modal-title">{isFirstTime ? "당신의 이름은?" : "이름 변경"}</h2>
          <p className="owner-modal-desc">
            만다라트 상단에 <strong>{trimmed || "이름"}'s</strong> 으로 표시됩니다.
          </p>
        </header>

        <input
          autoFocus
          className="owner-modal-input"
          maxLength={24}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="이름을 입력해주세요"
          value={draft}
        />

        <footer className="owner-modal-footer">
          {!isFirstTime && (
            <button type="button" className="route-pill" onClick={closePrompt}>
              취소
            </button>
          )}
          <button type="submit" className="route-pill is-primary" disabled={!canSubmit}>
            저장
          </button>
        </footer>
      </form>
    </div>
  );
};

const OwnerNameModal = () => {
  const { name, isPrompting, isFirstTime } = useOwnerNameContext();

  if (!isPrompting) return null;

  return <OwnerNameModalForm initialName={name} isFirstTime={isFirstTime} />;
};

export { OwnerNameModal };
