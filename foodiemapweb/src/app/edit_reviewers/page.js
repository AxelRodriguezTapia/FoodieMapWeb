"use client";

import { useState, useEffect } from "react";
import { db } from "../../components/firebaseConfig.js"; // Asegúrate de que la configuración de Firebase esté correctamente importada
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import styles from "../page.module.css";

export default function EditReviewers() {
  // Estado para manejar la visibilidad del formulario
  const [showForm, setShowForm] = useState(false);

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
  };

  // Función para manejar el envío del formulario para agregar un nuevo reviewer
  const handleCreateReviewer = async (e) => {
    e.preventDefault();
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
      setShowForm(false); // Ocultar el formulario después de guardar los cambios
      fetchReviewers(); // Refrescar la lista después de actualizar
    } catch (error) {
      console.error("Error updating reviewer: ", error);
    }
  };

  // Función para editar un reviewer
  const handleEdit = (id) => {
    const reviewer = reviewers.find((r) => r.id === id);
    setFormData(reviewer); // Rellenar el formulario con los datos actuales del reviewer
    if(showForm) {
        setShowForm(false); // Ocultar el formulario si ya está visible
    }else{
        setShowForm(true); // Mostrar el formulario de edición
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
    } catch (error) {
      console.error("Error deleting reviewer: ", error);
    }
  };

  // Función para cambiar la página de paginación
  const changePage = (pageNumber) => {
    setCurrentPage(pageNumber);
    setShowForm(false); // Ocultar el formulario al cambiar de página
  };

  useEffect(() => {
    fetchReviewers();
  }, []);

  // Paginar los reviewers
  const indexOfLastReviewer = currentPage * reviewersPerPage;
  const indexOfFirstReviewer = indexOfLastReviewer - reviewersPerPage;
  const currentReviewers = reviewers.slice(indexOfFirstReviewer, indexOfLastReviewer);

  return (
    <div className="flex">
      <div className={styles.mainContent}>
        <h1 className="text-4xl font-bold text-center text-blue-600 mb-6">EDIT REVIEWERS</h1>

        {/* Lista de reviewers */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-center text-gray-700">Reviewers List</h2>
          <ul className="space-y-4">
            {currentReviewers.map((reviewer) => (
              <li key={reviewer.id} className="flex justify-between items-center border-b pb-3 mb-3">
                <div>
                  <strong>{reviewer.name}</strong>
                  <p>{reviewer.websiteUrl}</p>
                </div>
                <button
                  onClick={() => handleEdit(reviewer.id)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>

          {/* Paginación */}
          <div className="flex justify-center space-x-4 mt-4">
            {[...Array(Math.ceil(reviewers.length / reviewersPerPage))].map((_, index) => (
              <button
                key={index}
                onClick={() => changePage(index + 1)}
                className={`p-2 ${currentPage === index + 1 ? "bg-blue-600 text-white" : "bg-gray-300"} rounded-full`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Formulario de edición */}
        {showForm && (
          <>
            <h2 className="text-2xl font-semibold text-center text-gray-700 mb-4">Edit Reviewer</h2>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div>
                <label htmlFor="avatarUrl" className="block text-lg font-medium text-gray-700">Avatar URL:</label>
                <input
                  type="text"
                  name="avatarUrl"
                  id="avatarUrl"
                  value={formData.avatarUrl}
                  onChange={handleEditChange}
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
                  value={formData.name}
                  onChange={handleEditChange}
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
                  value={formData.websiteUrl}
                  onChange={handleEditChange}
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
                  value={formData.channelId}
                  onChange={handleEditChange}
                  className="w-full p-3 border border-gray-300 rounded-md"
                  placeholder="Enter YouTube channel ID"
                />
              </div>
              <button
                type="submit"
                className="w-full p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update Reviewer
              </button>
            </form>
          </>
        )}

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
    </div>
  );
}
