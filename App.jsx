import { useState } from "react";

function App() {
  const [medicine, setMedicine] = useState("medicine_A");
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    if (!image) {
      alert("Upload image");
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("medicine", medicine);
    formData.append("image", image);

    const res = await fetch("http://127.0.0.1:5000/verify", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="container">
      <h1>💊 MediBlock</h1>

      <label>Medicine</label>
      <select value={medicine} onChange={e => setMedicine(e.target.value)}>
        <option value="medicine_A">Medicine A</option>
        <option value="medicine_B">Medicine B</option>
      </select>

      <label>Tablet Image</label>
      <input type="file" onChange={e => setImage(e.target.files[0])} />

      <button onClick={verify}>
        {loading ? "Verifying..." : "Verify"}
      </button>

      {result && (
        <div className={`result ${result.status}`}>
          <h2>{result.status}</h2>
          <p>{result.message}</p>
        </div>
      )}
    </div>
  );
}

export default App;
