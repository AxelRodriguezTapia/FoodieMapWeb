"use client";

import { useState, useEffect } from "react";
import { db } from "../../components/firebaseConfig.js"; // Asegúrate de que la configuración de Firebase esté correctamente importada
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import styles from "./styles.css";
import apiKeys from "../utils/apiKeys.js";  // Importa la clave de la API de YouTube

export default function EditReviewers() {
  const [activeTab, setActiveTab] = useState("edit"); // "edit" o "create"
  const [searchTerm, setSearchTerm] = useState(""); // Estado para el término de búsqueda
  const [filteredReviewers, setFilteredReviewers] = useState([]); // Estado para los reviewers filtrados
  // Estado para manejar los valores del formulario de edición
  const [formData, setFormData] = useState({
    avatarUrl: "",
    lastVideoUrl: "",
    name: "",
    websiteUrl: "",
    channelId: "",
  });

  // Estado para manejar los valores del formulario para crear un nuevo reviewer
  const [newReviewerFormData, setNewReviewerFormData] = useState({
    avatarUrl: "",
    lastVideoUrl: "",
    name: "",
    websiteUrl: "",
    channelId: "",
  });

  // Estado para manejar la lista de reviewers y la paginación
  const [reviewers, setReviewers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const reviewersPerPage = 1;

  // Función para manejar cambios en el formulario de creación
  const handleNewReviewerChange = (e) => {
    const { name, value } = e.target;
    setNewReviewerFormData({
      ...newReviewerFormData,
      [name]: value,
    });
  };

  // Función para manejar cambios en el formulario de edición
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Función para obtener los reviewers de Firebase
  const fetchReviewers = async () => {
    const reviewersCollection = collection(db, "reviewers");
    const reviewerSnapshot = await getDocs(reviewersCollection);
    const reviewerList = reviewerSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setReviewers(reviewerList);
    setFilteredReviewers(reviewerList); // Inicialmente, los reviewers filtrados son todos
  };

  // Función para manejar el envío del formulario para agregar un nuevo reviewer
  const handleCreateReviewer = async (e) => {
    e.preventDefault();
    
    // Verificar si algún campo está vacío
    if (
      !newReviewerFormData.name ||
      !newReviewerFormData.websiteUrl
    ) {
      alert("All fields are required.");
      return; // Detiene la ejecución si falta algún campo
    }
  
    try {
      await addDoc(collection(db, "reviewers"), newReviewerFormData);
      alert("Reviewer added successfully!");
      setNewReviewerFormData({
        avatarUrl: "",
        lastVideoUrl: "",
        name: "",
        websiteUrl: "",
        channelId: "",
      });
      fetchReviewers(); // Refrescar la lista después de agregar
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  // Función para manejar el envío del formulario para editar un reviewer
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const reviewerDoc = doc(db, "reviewers", formData.id);
      await updateDoc(reviewerDoc, formData);
      alert("Reviewer updated successfully!");
      setFormData({
        avatarUrl: "",
        lastVideoUrl: "",
        name: "",
        websiteUrl: "",
        channelId: "",
      });
      fetchReviewers(); // Refrescar la lista después de actualizar
    } catch (error) {
      console.error("Error updating reviewer: ", error);
    }
  };

  // Función para eliminar un reviewer
  const handleDelete = async () => {
    const reviewerDoc = doc(db, "reviewers", formData.id);
    try {
      await deleteDoc(reviewerDoc);
      alert("Reviewer deleted successfully!");
      setFormData({
        avatarUrl: "",
        lastVideoUrl: "",
        name: "",
        websiteUrl: "",
        channelId: "",
      });
      fetchReviewers(); // Refrescar la lista después de eliminar
      if(reviewers.length >= 1) {
        changePage(1);
      }
    } catch (error) {
      console.error("Error deleting reviewer: ", error);
    }
  };

  // Función para cambiar la página de paginación
  const changePage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Función para ir a la página anterior
  const goToPreviousPage = () => {
    setCurrentPage(currentPage > 1 ? currentPage - 1 : 1);
  };

  // Función para ir a la página siguiente
  const goToNextPage = () => {
    setCurrentPage(currentPage < Math.ceil(reviewers.length / reviewersPerPage) ? currentPage + 1 : currentPage);
  };

  const visitWebsite = () => {
    window.open(formData.websiteUrl, "_blank");
  };

  // Función para obtener el channelId de YouTube a partir del nombre de usuario o URL
  const fetchChannelId = async () => {
    const websiteUrl = formData.websiteUrl;  // Usamos la websiteUrl en vez del name
    
    // Verificamos si la URL tiene el formato de "@username" (e.g., https://www.youtube.com/@username)
    const channelNameRegex = /youtube\.com\/@([^/]+)/;

    let channelId;

    const matchChannelName = websiteUrl.match(channelNameRegex);
    if (matchChannelName) {
      const username = matchChannelName[1];  // Extraemos el nombre de usuario del canal
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${username}&key=${apiKeys}`;

      try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
          channelId = data.items[0].id.channelId;  // Obtenemos el channelId de la respuesta de la API
        } else {
          alert("Channel not found.");
        }
      } catch (error) {
        console.error("Error fetching channelId:", error);
        alert("Failed to fetch channel ID.");
      }
    } else {
      alert("Invalid YouTube URL format. Please enter a valid URL like 'https://www.youtube.com/@username'.");
    }

    // Si encontramos un channelId, lo actualizamos en el formulario
    if (channelId) {
      setFormData({
        ...formData,
        channelId: channelId,  // Establecemos el channelId en el estado
      });
    }
  };

  // Función para cargar los últimos vídeos a partir de un ID de vídeo
  const loadRecentVideos = async () => {
    let lastVideoId = formData.lastVideoUrl;
    if (!lastVideoId) {
      alert("No video ID found in the lastVideoUrl field.");
      return;
    }
  
    const videosCollection = collection(db, "VideosToEdit");
    let nextPageToken = "";
    let hasMoreVideos = true;
    let lastVideoDate;
  
    // Primera petición para obtener la fecha de publicación del lastVideoId
    const initialUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${lastVideoId}&key=${apiKeys}`;
    try {
      const initialResponse = await fetch(initialUrl);
      const initialData = await initialResponse.json();
      if (initialData.items && initialData.items.length > 0) {
        lastVideoDate = new Date(initialData.items[0].snippet.publishedAt);
      } else {
        alert("Failed to fetch the initial video data. vecause no hi ha items");
        return;
      }
    } catch (error) {
      console.error("Error fetching initial video data:", error);
      alert("Failed to fetch initial video data. ha fet puf");
      return;
    }
  
    while (hasMoreVideos) {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${formData.channelId}&maxResults=10&order=date&pageToken=${nextPageToken}&key=${apiKeys}`;
  
      try {
        const response = await fetch(url);
        const data = await response.json();
  
        if (data.items && data.items.length > 0) {
          for (const item of data.items) {
            const videoDate = new Date(item.snippet.publishedAt);
            if (videoDate <= lastVideoDate) {
              hasMoreVideos = false;
              break;
            }

            const videoData = {
              PlatformReviewId: item.id.videoId,
              publishDate: item.snippet.publishedAt,
              ReviewerId: formData.id,
              Title: item.snippet.title,
              Type: "YouTube",
            };
            await addDoc(videosCollection, videoData);
          }
  
          // Actualizar el campo lastVideoUrl del reviewer con el último videoId obtenido
          lastVideoId = data.items[data.items.length - 1].id.videoId;
          const reviewerDoc = doc(db, "reviewers", formData.id);
          await updateDoc(reviewerDoc, { lastVideoUrl: lastVideoId });
          formData.lastVideoUrl = lastVideoId;  // Actualizar el estado del formulario
  
          // Si hay un nextPageToken, continuar con la siguiente página
          if (data.nextPageToken) {
            nextPageToken = data.nextPageToken;
          } else {
            hasMoreVideos = false;
          }
        } else {
          hasMoreVideos = false;
        }
      } catch (error) {
        console.error("Error fetching recent videos:", error);
        alert("Failed to fetch recent videos.");
        hasMoreVideos = false;
      }
    }
  
    alert("Recent videos loaded and saved successfully!");
  };

  useEffect(() => {
    fetchReviewers();
  }, []);

  // Actualizar formData con el reviewer correspondiente cuando cambie la página
  useEffect(() => {
    const indexOfLastReviewer = currentPage * reviewersPerPage;
    const indexOfFirstReviewer = indexOfLastReviewer - reviewersPerPage;
    const currentReviewer = filteredReviewers.slice(indexOfFirstReviewer, indexOfLastReviewer)[0];
    
    if (currentReviewer) {
      setFormData({
        avatarUrl: currentReviewer.avatarUrl,
        lastVideoUrl: currentReviewer.lastVideoUrl,
        name: currentReviewer.name,
        websiteUrl: currentReviewer.websiteUrl,
        channelId: currentReviewer.channelId,
        id: currentReviewer.id,  // Asegúrate de tener el id del reviewer
      });
    }
  }, [currentPage, filteredReviewers]);

  // Filtrar los reviewers por el término de búsqueda
  useEffect(() => {
    const filtered = reviewers.filter(reviewer =>
      reviewer.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredReviewers(filtered);
  }, [searchTerm, reviewers]);

  // Paginar los reviewers
  const indexOfLastReviewer = currentPage * reviewersPerPage;
  const indexOfFirstReviewer = indexOfLastReviewer - reviewersPerPage;
  const currentReviewers = filteredReviewers.slice(indexOfFirstReviewer, indexOfLastReviewer);

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-center text-blue-700 text-2xl font-bold mb-4">EDIT REVIEWERS</h1>

      <div className="flex space-x-4 mb-6">
        <button
          className={`p-2 border rounded-md ${activeTab === "edit" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("edit")}
        >
          Edit Reviewer
        </button>
        <button
          className={`p-2 border rounded-md ${activeTab === "create" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("create")}
        >
          Create Reviewer
        </button>
      </div>

      {activeTab === "edit" && (
        <>
          {/* Buscador */}
          <div className="relative mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md"
              placeholder="Search by name"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-3 text-gray-500"
              >
                &times;
              </button>
            )}
          </div>

          {/* Formulario de edición */}
          {currentReviewers.length > 0 ? (
            <>
              <h2 className={styles.h2}>Edit Reviewer</h2>
              <form onSubmit={handleEditSubmit} className={styles.form}>
                <div>
                  <label htmlFor="avatarUrl" className="block text-lg font-medium text-gray-700">Avatar URL:</label>
                  <input
                    type="text"
                    name="avatarUrl"
                    id="avatarUrl"
                    value={formData.avatarUrl}
                    onChange={handleEditChange}
                    className={styles.input}
                    placeholder="Enter avatar URL"
                  />
                </div>
                {/* Mostrar la imagen asociada a la URL ingresada */}
                {formData.avatarUrl && (
                  <div className="mt-2">
                    <img
                      src={formData.avatarUrl}
                      alt="Avatar"
                      className="w-32 h-32 object-cover rounded-full"
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="name" className="block text-lg font-medium text-gray-700">Name:</label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleEditChange}
                    className={styles.input}
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label htmlFor="websiteUrl" className="block text-lg font-medium text-gray-700">Website URL:</label>
                  <input
                    type="text"
                    name="websiteUrl"
                    id="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={handleEditChange}
                    className={styles.input}
                    placeholder="Enter website URL"
                  />
                  <button
                    type="button"
                    onClick={visitWebsite}
                    className="ml-2 p-2 bg-blue-600 text-white rounded-md"
                  >
                    Visit Website
                  </button>
                </div>
                <div>
                  <label htmlFor="channelId" className="block text-lg font-medium text-gray-700">Channel ID:</label>
                  <input
                    type="text"
                    name="channelId"
                    id="channelId"
                    value={formData.channelId}
                    onChange={handleEditChange}
                    className={styles.input}
                    placeholder="Enter YouTube channel ID"
                  />
                  <button
                    type="button"
                    onClick={fetchChannelId}
                    className="ml-2 p-2 bg-blue-600 text-white rounded-md"
                  >
                    Get Channel ID
                  </button>
                </div>
                <div>
                  <label htmlFor="lastVideoUrl" className="block text-lg font-medium text-gray-700">Last Video URL:</label>
                  <input
                    type="text"
                    name="lastVideoUrl"
                    id="lastVideoUrl"
                    value={formData.lastVideoUrl}
                    onChange={handleEditChange}
                    className={styles.input}
                    placeholder="Enter last video URL"
                  />
                  <button
                    type="button"
                    onClick={loadRecentVideos}
                    className="ml-2 p-2 bg-blue-600 text-white rounded-md"
                  >
                    Load Recent Videos
                  </button>
                </div>
                <button
                  type="submit"
                  className={styles.button}
                >
                  Update Reviewer
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className={styles.buttonRojo}
                >
                  Delete Reviewer
                </button>
              </form>
            </>
          ) : (
            <p>No reviewers found.</p>
          )}

          {/* Paginación con botones "Previous" y "Next" */}
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={goToPreviousPage}
              className={`${styles.button} ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            <div className="flex space-x-4">
              {[...Array(Math.ceil(filteredReviewers.length / reviewersPerPage))].map((_, index) => (
                <button
                  key={index}
                  onClick={() => changePage(index + 1)}
                  className={`${styles.button} ${currentPage === index + 1 ? 'bg-blue-600 text-white' : ''}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <button
              onClick={goToNextPage}
              className={`${styles.button} ${currentPage === Math.ceil(filteredReviewers.length / reviewersPerPage) ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={currentPage === Math.ceil(filteredReviewers.length / reviewersPerPage)}
            >
              Next
            </button>
          </div>
        </>
      )}

      {activeTab === "create" && (
        <div>
          {/* Formulario de creación de un nuevo reviewer */}
          <h2 className="text-2xl font-semibold text-center text-gray-700 mb-4">Create New Reviewer</h2>
          <form onSubmit={handleCreateReviewer} className="space-y-6">
            <div>
              <label htmlFor="avatarUrl" className="block text-lg font-medium text-gray-700">Avatar URL:</label>
              <input
                type="text"
                name="avatarUrl"
                id="avatarUrl"
                value={newReviewerFormData.avatarUrl}
                onChange={handleNewReviewerChange}
                className="w-full p-3 border border-gray-300 rounded-md"
                placeholder="Enter avatar URL"
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-lg font-medium text-gray-700">Name:</label>
              <input
                type="text"
                name="name"
                id="name"
                value={newReviewerFormData.name}
                onChange={handleNewReviewerChange}
                className="w-full p-3 border border-gray-300 rounded-md"
                placeholder="Enter name"
              />
            </div>
            <div>
              <label htmlFor="websiteUrl" className="block text-lg font-medium text-gray-700">Website URL:</label>
              <input
                type="text"
                name="websiteUrl"
                id="websiteUrl"
                value={newReviewerFormData.websiteUrl}
                onChange={handleNewReviewerChange}
                className="w-full p-3 border border-gray-300 rounded-md"
                placeholder="Enter website URL"
              />
            </div>
            <div>
              <label htmlFor="channelId" className="block text-lg font-medium text-gray-700">Channel ID:</label>
              <input
                type="text"
                name="channelId"
                id="channelId"
                value={newReviewerFormData.channelId}
                onChange={handleNewReviewerChange}
                className="w-full p-3 border border-gray-300 rounded-md"
                placeholder="Enter YouTube channel ID"
              />
            </div>
            <button
              type="submit"
              className="w-full p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Reviewer
            </button>
          </form>
        </div>
      )}
    </div>
  );
}