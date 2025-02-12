"use client";

import { useState } from "react";
import { db } from "../../components/firebaseConfig.js"; // Asegúrate de que la configuración de Firebase esté correctamente importada
import { collection, addDoc } from "firebase/firestore";
import styles from "../page.module.css";

export default function EditReviewers() {
  // Estado para manejar la visibilidad del formulario
  const [showForm, setShowForm] = useState(false);

  // Estado para manejar los valores del formulario
  const [formData, setFormData] = useState({
    avatarUrl: "",
    lastVideoUrl: "",
    name: "",
    websiteUrl: "",
    channelId: "",
  });

  // Función para manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Enviar datos a Firestore
      await addDoc(collection(db, "reviewers"), formData);
      alert("Reviewer added successfully!");
      // Limpiar formulario
      setFormData({
        avatarUrl: "",
        lastVideoUrl: "",
        name: "",
        websiteUrl: "",
        channelId: "",
      });
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  // Función para obtener el canal ID de YouTube (simplificado)
  const fetchChannelId = async () => {
    const channelId = formData.channelId; // Asegúrate de que el canal ID esté lleno
    if (!channelId) {
      alert("Please enter a valid YouTube channel URL.");
      return;
    }

    // Aquí podrías integrar la API de YouTube para obtener el canal ID, en este ejemplo se deja como texto estático
    const apiKey = "YOUR_YOUTUBE_API_KEY"; // Reemplaza con tu API Key de YouTube
    const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${channelId}&key=${apiKey}`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      const id = data.items[0]?.id; // Extraer el canal ID desde la respuesta
      if (id) {
        alert(`Channel ID: ${id}`);
      } else {
        alert("Channel not found.");
      }
    } catch (error) {
      console.error("Error fetching YouTube channel ID: ", error);
    }
  };

  return (
    <div className="flex">
      <div className={styles.mainContent}>
        <h1 className="text-5xl font-bold text-center">EDIT REVIEWERS</h1>

        {/* Botón para mostrar el formulario */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="mt-4 p-3 bg-blue-600 text-white rounded"
        >
          {showForm ? "Hide Form" : "Add Reviewer"}
        </button>

        {/* Formulario desplegable */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="avatarUrl" className="block text-lg">
                Avatar URL:
              </label>
              <input
                type="text"
                name="avatarUrl"
                id="avatarUrl"
                value={formData.avatarUrl}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter avatar URL"
              />
            </div>

            <div>
              <label htmlFor="lastVideoUrl" className="block text-lg">
                Last Video URL (Optional):
              </label>
              <input
                type="text"
                name="lastVideoUrl"
                id="lastVideoUrl"
                value={formData.lastVideoUrl}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter last video URL (optional)"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-lg">
                Name:
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter name"
              />
            </div>

            <div>
              <label htmlFor="websiteUrl" className="block text-lg">
                Website URL:
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  name="websiteUrl"
                  id="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Enter website URL"
                />
                <button
                  type="button"
                  onClick={() => window.open(formData.websiteUrl, "_blank")}
                  className="ml-2 p-2 bg-green-600 text-white rounded"
                >
                  Visit
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="channelId" className="block text-lg">
                Channel ID:
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  name="channelId"
                  id="channelId"
                  value={formData.channelId}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Enter YouTube channel ID"
                />
                <button
                  type="button"
                  onClick={fetchChannelId}
                  className="ml-2 p-2 bg-yellow-600 text-white rounded"
                >
                  Get Channel ID
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="mt-4 w-full p-3 bg-blue-600 text-white rounded"
              >
                Add Reviewer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
