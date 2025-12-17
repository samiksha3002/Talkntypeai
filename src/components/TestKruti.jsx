import { useState } from "react";
import { mangalToKruti } from "../utils/mangalToKruti";

export default function TestKruti() {
  const [text, setText] = useState("");

  return (
    <div style={{ padding: 20 }}>
      <h3>Mangal → KrutiDev</h3>

      <textarea
        placeholder="Type Hindi (Mangal)"
        style={{ width: "100%", height: 100 }}
        onChange={(e) => setText(e.target.value)}
      />

      <div
        style={{
          marginTop: 20,
          padding: 15,
          border: "1px solid #ccc",
          fontFamily: "KrutiDev",
          fontSize: 20
        }}
      >
        {mangalToKruti(text)}
      </div>
    </div>
  );
}
