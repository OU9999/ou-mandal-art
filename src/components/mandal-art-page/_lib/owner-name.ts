const OWNER_NAME_STORAGE_KEY = "ou-mandal-art:owner-name:v1";

const getInitialOwnerName = () => {
  if (typeof window === "undefined") return "";

  try {
    const saved = window.localStorage.getItem(OWNER_NAME_STORAGE_KEY);
    if (typeof saved !== "string") return "";
    return saved;
  } catch {
    return "";
  }
};

export { OWNER_NAME_STORAGE_KEY, getInitialOwnerName };
