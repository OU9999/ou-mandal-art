import { useEffect, useState } from "react";
import { OWNER_NAME_STORAGE_KEY, getInitialOwnerName } from "../_lib/owner-name";

interface OwnerNameValue {
  name: string;
  isPrompting: boolean;
  isFirstTime: boolean;
  save: (input: string) => void;
  openPrompt: () => void;
  closePrompt: () => void;
}

const useOwnerName = (): OwnerNameValue => {
  const [name, setName] = useState(getInitialOwnerName);
  const [isPrompting, setIsPrompting] = useState(() => getInitialOwnerName().trim().length === 0);

  /**
   * name 이 변경될 때마다 localStorage 에 동기화한다.
   * 다음 마운트 시 getInitialOwnerName 이 같은 키로 복원한다.
   */
  useEffect(() => {
    window.localStorage.setItem(OWNER_NAME_STORAGE_KEY, name);
  }, [name]);

  const save = (input: string) => {
    const trimmed = input.trim();
    if (trimmed.length === 0) return;
    setName(trimmed);
    setIsPrompting(false);
  };

  const openPrompt = () => setIsPrompting(true);
  const closePrompt = () => {
    if (name.trim().length === 0) return;
    setIsPrompting(false);
  };

  return {
    name,
    isPrompting,
    isFirstTime: name.trim().length === 0,
    save,
    openPrompt,
    closePrompt,
  };
};

export { useOwnerName };
export type { OwnerNameValue };
