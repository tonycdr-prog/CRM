import { useState } from "react";

export default function DesignToggle() {
  const [enabled, setEnabled] = useState(false);

  return (
    <label>
      <input
        type="checkbox"
        checked={enabled}
        onChange={(event) => setEnabled(event.target.checked)}
      />
      {" "}
      Design Mode
    </label>
  );
}
