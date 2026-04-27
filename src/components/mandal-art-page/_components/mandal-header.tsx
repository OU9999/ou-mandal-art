import { useOwnerNameContext } from "../_hooks/owner-name-context";

const MandalHeader = () => {
  const { name, openPrompt } = useOwnerNameContext();
  const display = name.trim().length > 0 ? `${name}'s` : "Your name's";

  return (
    <header className="showcase-copy mandal-copy">
      <button type="button" className="owner-name-trigger" onClick={openPrompt}>
        {display}
      </button>
      <h1>Mandal-Art</h1>
    </header>
  );
};

export { MandalHeader };
