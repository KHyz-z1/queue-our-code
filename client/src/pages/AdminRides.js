// client/src/pages/AdminRides.js
import React, { useEffect, useState } from "react";
import api from "../utils/api"; 

const cardStyle = {
  background: "#fff",
  borderRadius: 8,
  padding: 12,
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
};

const SERVER = (process.env.REACT_APP_API_BASE || "http://localhost:5000").replace(/\/$/, "");

function buildImageUrl(path) {
  if (!path) return null;
  // already absolute?
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SERVER}${path}`;
}

export default function AdminRides() {
  const [rides, setRides] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // form state
  const emptyForm = {
    name: "",
    status: "open",
    capacity: 1,
    duration: 5,
    imageFile: null, // file object if selected
    description: "",
    category: "Attractions",
    location: ""
  };
  const [formData, setFormData] = useState(emptyForm);
  const [previewImage, setPreviewImage] = useState(null);
  const [editingRide, setEditingRide] = useState(null);

  // load rides
  useEffect(() => {
    loadRides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadRides() {
    setLoading(true);
    try {
      const res = await api.get("/admin/rides");
      setRides(res.data.rides || []);
    } catch (err) {
      console.error("load rides err", err);
      setMessage("Could not load rides");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files && files[0] ? files[0] : null;
      setFormData(prev => ({ ...prev, imageFile: file }));
      if (file) {
        const url = URL.createObjectURL(file);
        setPreviewImage(url);
      } else {
        setPreviewImage(null);
      }
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function resetForm() {
    setFormData(emptyForm);
    setPreviewImage(null);
    setEditingRide(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    try {
      if (!formData.name.trim()) {
        setMessage("Name is required");
        return;
      }

      // Build FormData for optional image upload
      const fd = new FormData();
      fd.append("name", formData.name.trim());
      fd.append("status", formData.status);
      fd.append("capacity", formData.capacity);
      fd.append("duration", formData.duration);
      fd.append("description", formData.description || "");
      fd.append("category", formData.category || "");
      if (formData.location) fd.append("location", formData.location);
      if (formData.imageFile) fd.append("image", formData.imageFile);

      if (editingRide) {
        // update
        const res = await api.put(`/admin/rides/${editingRide.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setMessage(res.data.msg || "Ride updated");
      } else {
        // create
        const res = await api.post("/admin/rides", fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setMessage(res.data.msg || "Ride created");
      }

      resetForm();
      await loadRides();
    } catch (err) {
      console.error("submit err", err);
      const server = err.response?.data?.msg || err.message;
      setMessage(server || "Submit failed");
    }
  }

  function handleEdit(ride) {
    // populate form with ride data
    setEditingRide(ride);
    setFormData({
      name: ride.name || "",
      status: ride.status || "open",
      capacity: ride.capacity || 1,
      duration: ride.duration || 5,
      imageFile: null, // leave null unless user selects new file
      description: ride.description || "",
      category: ride.category || "Attractions",
      location: ride.location ? JSON.stringify(ride.location) : ""
    });
    setPreviewImage(buildImageUrl(ride.image));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this ride? This cannot be undone.")) return;
    try {
      const res = await api.delete(`/admin/rides/${id}`);
      setMessage(res.data.msg || "Ride deleted");
      await loadRides();
    } catch (err) {
      console.error("delete err", err);
      setMessage(err.response?.data?.msg || "Delete failed");
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 18 }}>
      <h2 style={{ textAlign: "center", marginBottom: 12 }}>Ride Management</h2>

      {message && (
        <div style={{ marginBottom: 12, padding: 10, borderRadius: 6, background: "#e6f6ff", color: "#064e3b" }}>
          {message}
        </div>
      )}

      {/* Form card (full width, separated from list) */}
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>{editingRide ? "Edit Ride" : "Add New Ride"}</h3>

        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 12, alignItems: "start" }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Name</label>
            <input
              type="text"
              name="name"
              placeholder="Ride name"
              value={formData.name}
              onChange={handleChange}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #d1d5db" }}
              required
            />

            <div style={{ marginTop: 12 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Short description shown to guests"
                style={{ width: "100%", minHeight: 80, padding: 10, borderRadius: 6, border: "1px solid #d1d5db" }}
              />
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Status</label>
                <select name="status" value={formData.status} onChange={handleChange} style={{ width: "100%", padding: 10, borderRadius: 6 }}>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div style={{ width: 120 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Capacity</label>
                <input type="number" name="capacity" value={formData.capacity} onChange={handleChange}
                  style={{ width: "100%", padding: 10, borderRadius: 6 }} min={1} />
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>Seats per batch</div>
              </div>

              <div style={{ width: 140 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Duration</label>
                <input type="number" name="duration" value={formData.duration} onChange={handleChange}
                  style={{ width: "100%", padding: 10, borderRadius: 6 }} min={1} />
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>Minutes per batch</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Category</label>
                  <select name="category" value={formData.category} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 6 }}>
                    <option value="Attractions">Attractions</option>
                    <option value="Kiddie Rides">Kiddie Rides</option>
                    <option value="Family Rides">Family Rides</option>
                    <option value="Teen/Adult Rides">Teen/Adult Rides</option>
                    <option value="Extreme Rides">Extreme Rides</option>
                  </select>
              </div>

              <div style={{ width: 180 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Image (optional)</label>
                <input type="file" name="image" accept="image/*" onChange={handleChange} />
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>Small images recommended (≤ 3MB).</div>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <button type="submit" style={{ background: "#059669", color: "#fff", padding: "10px 14px", borderRadius: 6, border: "none" }}>
                {editingRide ? "Save changes" : "Create ride"}
              </button>

              {editingRide && (
                <button type="button" onClick={() => { resetForm(); }}
                  style={{ marginLeft: 8, padding: "10px 14px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff" }}>
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Preview Card */}
          <div>
            <div style={{ borderRadius: 8, overflow: "hidden", height: 170, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {previewImage ? (
                <img src={previewImage} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ color: "#9ca3af" }}>Image preview</div>
              )}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>
              Preview will show the uploaded image cropped to the above preview area.
            </div>
          </div>
        </form>
      </div>

      {/* Rides list */}
      <div>
        {loading ? <div>Loading rides...</div> : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {rides.map((ride) => {
            const id = ride.id || ride._id || (ride._id && ride._id.$oid);
            const img = buildImageUrl(ride.image);
            return (
              <article key={id} style={{ ...cardStyle, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ height: 160, overflow: "hidden", background: "#f8fafc" }}>
                  {img ? (
                    <img src={img} alt={ride.name} style={{ width: "100%", height: "160px", objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                      No image
                    </div>
                  )}
                </div>

                <div style={{ padding: 12, borderTop: "1px solid #eef2f7", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h4 style={{ margin: "0 0 6px 0" }}>{ride.name}</h4>
                      <div style={{ fontSize: 13, color: "#6b7280" }}>
                        <strong>Category:</strong> {ride.category || "Attractions"} &nbsp; | &nbsp;
                        <strong>Status:</strong> {ride.status} &nbsp; | &nbsp;
                        <strong>Duration:</strong> {ride.duration} min
                      </div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 12, color: "#6b7280" }}>
                      {new Date(ride.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ marginTop: 10, color: "#374151", fontSize: 14, minHeight: 48 }}>
                    {ride.description ? ride.description : <span style={{ color: "#9ca3af" }}>No description</span>}
                  </div>

                  <div style={{ marginTop: "auto", display: "flex", gap: 8 }}>
                    <button onClick={() => handleEdit(ride)} style={{ padding: "8px 12px", borderRadius: 6, background: "#f59e0b", color: "#fff", border: "none" }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(id)} style={{ padding: "8px 12px", borderRadius: 6, background: "#ef4444", color: "#fff", border: "none" }}>
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
