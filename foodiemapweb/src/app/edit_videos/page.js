"use client";

import { useState, useEffect } from "react";
import { db } from "../../components/firebaseConfig.js";
import { collection, getDocs, query, orderBy, limit, startAt, doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { searchPlaces,getPlaceDetails } from "../utils/googlePlacesService.js"; // Asegúrate de que la ruta sea correcta

export default function ListVideos() {
  const [videos, setVideos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState({}); // Track which video forms are open
  const [formData, setFormData] = useState({}); // Store form data for each video
  const [activeTab, setActiveTab] = useState({}); // Track active tab for each video
  const videosPerPage = 1;
  const [suggestions, setSuggestions] = useState([]);

  const fetchTotalVideos = async () => {
    const videosCollection = collection(db, "VideosToEdit");
    const videoSnapshot = await getDocs(videosCollection);
    setTotalPages(Math.ceil(videoSnapshot.size / videosPerPage));
  };

  const fetchVideos = async (page = 1) => {
    setLoading(true);
    try {
      const videosCollection = collection(db, "VideosToEdit");
      let videosQuery = query(
        videosCollection,
        orderBy("publishDate", "desc"),
        limit(videosPerPage)
      );

      if (page > 1) {
        const offset = (page - 1) * videosPerPage;
        const allDocs = await getDocs(query(videosCollection, orderBy("publishDate", "desc")));
        const startDoc = allDocs.docs[offset];
        if (startDoc) {
          videosQuery = query(
            videosCollection,
            orderBy("publishDate", "desc"),
            startAt(startDoc),
            limit(videosPerPage)
          );
        }
      }

      const videoSnapshot = await getDocs(videosQuery);
      setVideos(videoSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching videos: ", error);
    }
    setLoading(false);
  };

  const handleInputChange = (videoId, e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [videoId]: {
        ...prev[videoId],
        [name]: value,
      },
    }));
  };
  const handleSearchClick = async (query) => {
    try {
      const places = await searchPlaces(query); // Llama a tu servicio de Google Places
      setSuggestions(places); // Actualiza las sugerencias con los resultados
    } catch (error) {
      console.error("Error en la búsqueda:", error);
    }
  };

  const handleSuggestionClick = async (videoId, suggestion) => {
    try {
      // Llama a getPlaceDetails para obtener más detalles del lugar
      const placeDetails = await getPlaceDetails(suggestion.id);
  
      setFormData((prev) => ({
        ...prev,
        [videoId]: {
          ...prev[videoId],
          searchRestaurant: suggestion.displayName.text, // Nombre del restaurante
          googlePlaceId: suggestion.id, // ID de Google Place
          restaurantAddress: placeDetails.formattedAddress || "", // Dirección del restaurante
          restaurantName: suggestion.displayName.text, // Nombre del restaurante
          restaurantPhone: placeDetails.internationalPhoneNumber || "", // Teléfono del restaurante
          restaurantWebsite: placeDetails.website || "", // Website del restaurante
          tripadvisorLink: "", // Puedes agregar lógica para obtener este dato si es necesario
          googleMapsLink: placeDetails.googleMapsUri || "", // Enlace de Google Maps
          googleMapsRating: placeDetails.rating || "", // Rating de Google Maps
          googleMapsReviews: placeDetails.userRatingCount || "", // Número de reviews en Google Maps
          googleMapsPriceLevel: placeDetails.priceLevel || "", // Nivel de precio en Google Maps
          restaurantLocation: placeDetails.location
            ? `${placeDetails.location.latitude}, ${placeDetails.location.longitude}`
            : "", // Ubicación del restaurante
          restaurantStatus: placeDetails.businessStatus || "", // Estado del restaurante
        },
      }));
  
      setSuggestions([]); // Limpia las sugerencias después de seleccionar una
    } catch (error) {
      console.error("Error al obtener detalles del lugar:", error);
      // Manejo de errores, si es necesario
    }
  };

  const handleSubmit = async (videoId, e) => {
    e.preventDefault();
    const reviewData = formData[videoId];

    try {
      // Reference to the specific video document
      const videoDocRef = doc(db, "VideosToEdit", videoId);

      // Update the document by adding the review to the "reviews" array
      await updateDoc(videoDocRef, {
        reviews: arrayUnion(reviewData),
      });

      console.log("Review added successfully for video:", videoId);

      // Close the form and clear the form data for this video
      setShowForm((prev) => ({ ...prev, [videoId]: false }));
      setFormData((prev) => ({ ...prev, [videoId]: {} }));
    } catch (error) {
      console.error("Error saving review:", error);
    }
  };

  const handleReviewUpdate = async (videoId, reviewIndex, updatedReview) => {
    try {
      const videoDocRef = doc(db, "VideosToEdit", videoId);

      // Fetch the current reviews
      const videoDocSnapshot = await getDoc(videoDocRef);
      const currentReviews = videoDocSnapshot.data().reviews || [];

      // Update the specific review
      currentReviews[reviewIndex] = updatedReview;

      // Save the updated reviews back to the document
      await updateDoc(videoDocRef, { reviews: currentReviews });

      console.log("Review updated successfully for video:", videoId);
    } catch (error) {
      console.error("Error updating review:", error);
    }
  };

  useEffect(() => {
    fetchTotalVideos();
    fetchVideos(currentPage);
  }, [currentPage]);

  return (
    <div className="flex flex-col items-center bg-white min-h-screen py-8">
      <h1 className="text-center text-blue-700 text-4xl font-extrabold mb-6">EDIT VIDEOS</h1>
      <div className="w-full max-w-2xl bg-gray-100 shadow-lg rounded-lg p-6">
        <h2 className="text-center text-2xl font-bold mb-4">Edit Video</h2>
        {loading && <p className="text-gray-500 text-center">Loading...</p>}
        <div className="flex justify-center items-center mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 mx-1"
          >
            Previous
          </button>
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`px-4 py-2 mx-1 rounded-lg ${currentPage === index + 1 ? "bg-red-600 text-white" : "bg-gray-300 text-gray-700"}`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 mx-1"
          >
            Next
          </button>
        </div>
        {videos.map((video) => (
          <div key={video.id} className="border-b pb-4 mb-4">
            <h3 className="text-xl font-semibold text-center text-gray-800">{video.Title}</h3>
            <p className="text-sm text-gray-500 text-center">Published: {new Date(video.publishDate).toLocaleDateString()}</p>
            <div className="flex justify-center my-4">
              <iframe
                className="rounded-lg shadow-md w-full max-w-lg h-64"
                src={`https://www.youtube.com/embed/${video.PlatformReviewId}`}
                title={video.Title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <button
  onClick={() => {
    // Crear una nueva review vacía
    const newReview = {
      reviewStartTime: "",
      searchRestaurant: "",
      restaurantDescription: "",
      googlePlaceId: "",
      restaurantName: "",
      restaurantAddress: "",
      restaurantPhone: "",
      restaurantWebsite: "",
      tripadvisorLink: "",
      googleMapsLink: "",
      googleMapsRating: "",
      googleMapsReviews: "",
      googleMapsPriceLevel: "",
      restaurantLocation: "",
      restaurantImage: "",
      restaurantStatus: "",
    };

    // Actualizar el estado de videos para añadir la nueva review
    setVideos((prevVideos) =>
      prevVideos.map((v) =>
        v.id === video.id
          ? {
              ...v,
              reviews: [...(v.reviews || []), newReview],
            }
          : v
      )
    );

    // Activar automáticamente la nueva review para editarla
    setActiveTab((prev) => ({
      ...prev,
      [video.id]: (video.reviews?.length || 0), // Índice de la nueva review
    }));

    // Inicializar formData con la nueva review
    setFormData((prev) => ({
      ...prev,
      [video.id]: newReview,
    }));
  }}
  className="px-4 py-2 bg-green-600 text-white rounded-lg mx-auto block"
>
  Añadir Review
</button>
            {showForm[video.id] && (
              <form onSubmit={(e) => handleSubmit(video.id, e)} className="mt-4 bg-gray-100 p-6 rounded-lg shadow-md space-y-4">
                <h2 className="text-2xl font-semibold text-center text-gray-700 mb-4">Añadir Review</h2>
                <div>
                  <label htmlFor="reviewStartTime" className="block text-lg font-medium text-gray-700">Segundo en el que empieza la review:</label>
                  <input
                    type="text"
                    name="reviewStartTime"
                    id="reviewStartTime"
                    placeholder="Segundo en el que empieza la review"
                    value={formData[video.id]?.reviewStartTime || ""}
                    onChange={(e) => handleInputChange(video.id, e)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="restaurantDescription" className="block text-lg font-medium text-gray-700">Descripción del restaurante:</label>
                  <textarea
                    name="restaurantDescription"
                    id="restaurantDescription"
                    placeholder="Descripción del restaurante"
                    value={formData[video.id]?.restaurantDescription || ""}
                    onChange={(e) => handleInputChange(video.id, e)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  ></textarea>
                </div>
                <div>
        <label htmlFor="searchRestaurant" className="block text-lg font-medium text-gray-700">
          Buscar restaurante:
        </label>
        <div className="relative">
          <div className="flex items-center">
            <input
              type="text"
              name="searchRestaurant"
              id="searchRestaurant"
              placeholder="Buscar restaurante"
              value={formData[video.id]?.searchRestaurant || ""}
              onChange={(e) => handleInputChange(video.id, e)}
              className="w-full p-3 border border-gray-300 rounded-md"
            />
            <button
              type="button"
              onClick={() => handleSearchClick(formData[video.id]?.searchRestaurant || "")}
              className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Buscar
            </button>
          </div>
          {suggestions.length > 0 && (
            <ul className="absolute z-10 bg-white border border-gray-300 rounded-md mt-1 w-full max-h-40 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  onClick={() => handleSuggestionClick(video.id, suggestion)}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                >
                  {`${suggestion.displayName.text} - ${suggestion.formattedAddress}`}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
                <div>
                  <label htmlFor="googlePlaceId" className="block text-lg font-medium text-gray-700">Google Place ID:</label>
                  <input
                    type="text"
                    name="googlePlaceId"
                    id="googlePlaceId"
                    placeholder="Google Place ID"
                    value={formData[video.id]?.googlePlaceId || ""}
                    onChange={(e) => handleInputChange(video.id, e)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="restaurantName" className="block text-lg font-medium text-gray-700">Nombre del restaurante:</label>
                  <input
                    type="text"
                    name="restaurantName"
                    id="restaurantName"
                    placeholder="Nombre del restaurante"
                    value={formData[video.id]?.restaurantName || ""}
                    onChange={(e) => handleInputChange(video.id, e)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="restaurantAddress" className="block text-lg font-medium text-gray-700">Dirección del restaurante:</label>
                  <input
                    type="text"
                    name="restaurantAddress"
                    id="restaurantAddress"
                    placeholder="Dirección del restaurante"
                    value={formData[video.id]?.restaurantAddress || ""}
                    onChange={(e) => handleInputChange(video.id, e)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="restaurantPhone" className="block text-lg font-medium text-gray-700">Teléfono del restaurante:</label>
                  <input
                    type="text"
                    name="restaurantPhone"
                    id="restaurantPhone"
                    placeholder="Teléfono del restaurante"
                    value={formData[video.id]?.restaurantPhone || ""}
                    onChange={(e) => handleInputChange(video.id, e)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="restaurantWebsite" className="block text-lg font-medium text-gray-700">Website del restaurante:</label>
                  <input
                    type="text"
                    name="restaurantWebsite"
                    id="restaurantWebsite"
                    placeholder="Website del restaurante"
                    value={formData[video.id]?.restaurantWebsite || ""}
                    onChange={(e) => handleInputChange(video.id, e)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="tripadvisorLink" className="block text-lg font-medium text-gray-700">Ficha de Tripadvisor:</label>
                  <input
                    type="text"
                    name="tripadvisorLink"
                    id="tripadvisorLink"
                    placeholder="Ficha de Tripadvisor"
                    value={formData[video.id]?.tripadvisorLink || ""}
                    onChange={(e) => handleInputChange(video.id, e)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="googleMapsLink" className="block text-lg font-medium text-gray-700">Ficha de Google Maps:</label>
                  <input
                    type="text"
                    name="googleMapsLink"
                    id="googleMapsLink"
                    placeholder="Ficha de Google Maps"
                    value={formData[video.id]?.googleMapsLink || ""}
                    onChange={(e) => handleInputChange(video.id, e)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="googleMapsRating" className="block text-lg font-medium text-gray-700">Rating de Google Maps:</label>
                  <input
                    type="number"
                    name="googleMapsRating"
                    id="googleMapsRating"
                    placeholder="Rating de Google Maps"
                    value={formData[video.id]?.googleMapsRating || ""}
                    onChange={(e) => handleInputChange(video.id, e)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="googleMapsReviews" className="block text-lg font-medium text-gray-700">Número de reviews en Google Maps:</label>
                  <input
                    type="number"
                    name="googleMapsReviews"
                    id="googleMapsReviews"
                    placeholder="Número de reviews en Google Maps"
                    value={formData[video.id]?.googleMapsReviews || ""}
                    onChange={(e) => handleInputChange(video.id, e)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="googleMapsPriceLevel" className="block text-lg font-medium text-gray-700">Price level de Google Maps:</label>
                  <input
                    type="text"
                    name="googleMapsPriceLevel"
                    id="googleMapsPriceLevel"
                    placeholder="Price level de Google Maps"
                    value={formData[video.id]?.googleMapsPriceLevel || ""}
                    onChange={(e) => handleInputChange(video.id, e)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="restaurantLocation" className="block text-lg font-medium text-gray-700">Mapa de la ubicación del lugar:</label>
                  <input
                    type="text"
                    name="restaurantLocation"
                    id="restaurantLocation"
                    placeholder="Mapa de la ubicación del lugar"
                    value={formData[video.id]?.restaurantLocation || ""}
                    onChange={(e) => handleInputChange(video.id, e)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="restaurantImage" className="block text-lg font-medium text-gray-700">Imagen del restaurante:</label>
                  <input
                    type="text"
                    name="restaurantImage"
                    id="restaurantImage"
                    placeholder="Imagen del restaurante"
                    value={formData[video.id]?.restaurantImage || ""}
                    onChange={(e) => handleInputChange(video.id, e)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="restaurantStatus" className="block text-lg font-medium text-gray-700">Estado del restaurante:</label>
                  <input
                    type="text"
                    name="restaurantStatus"
                    id="restaurantStatus"
                    placeholder="Estado del restaurante"
                    value={formData[video.id]?.restaurantStatus || ""}
                    onChange={(e) => handleInputChange(video.id, e)}
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex justify-between">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm((prev) => ({ ...prev, [video.id]: false }))}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
            {/* Tabs for reviews */}
            {video.reviews && video.reviews.length > 0 && (
              <div className="mt-4">
                <div className="flex space-x-2">
                {video.reviews.map((review, index) => (
  <button
    key={index}
    onClick={() => {
      setActiveTab((prev) => ({ ...prev, [video.id]: index }));
      
      // Sincronizar formData con los datos actuales de la review seleccionada
      setFormData((prev) => ({
        ...prev,
        [video.id]: {
          ...video.reviews[index], // Asegúrate de copiar los datos actuales de la review
        },
      }));
    }}
    className={`px-4 py-2 rounded-md ${
      activeTab[video.id] === index
        ? "bg-blue-600 text-white"
        : "bg-gray-300 text-gray-700"
    }`}
  >
    Review {index + 1}
  </button>
))}
                </div>

                {/* Show the active review */}
                {activeTab[video.id] !== undefined && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleReviewUpdate(
                        video.id,
                        activeTab[video.id],
                        formData[video.id]
                      );
                    }}
                    className="mt-4 bg-gray-100 p-6 rounded-lg shadow-md space-y-4"
                  >
                    <h2 className="text-2xl font-semibold text-center text-gray-700 mb-4">
                      Editar Review {activeTab[video.id] + 1}
                    </h2>
                    <div>
                      <label
                        htmlFor="reviewStartTime"
                        className="block text-lg font-medium text-gray-700"
                      >
                        Segundo en el que empieza la review:
                      </label>
                      <input
                        type="text"
                        name="reviewStartTime"
                        id="reviewStartTime"
                        placeholder="Segundo en el que empieza la review"
                        value={
                          formData[video.id]?.reviewStartTime ||
                          video.reviews[activeTab[video.id]].reviewStartTime ||
                          ""
                        }
                        onChange={(e) => handleInputChange(video.id, e)}
                        className="w-full p-3 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="restaurantDescription"
                        className="block text-lg font-medium text-gray-700"
                      >
                        Descripción del restaurante:
                      </label>
                      <textarea
                        name="restaurantDescription"
                        id="restaurantDescription"
                        placeholder="Descripción del restaurante"
                        value={
                          formData[video.id]?.restaurantDescription ||
                          video.reviews[activeTab[video.id]].restaurantDescription ||
                          ""
                        }
                        onChange={(e) => handleInputChange(video.id, e)}
                        className="w-full p-3 border border-gray-300 rounded-md"
                      ></textarea>
                    </div>
                    <div>
        <label htmlFor="searchRestaurant" className="block text-lg font-medium text-gray-700">
          Buscar restaurante:
        </label>
        <div className="relative">
          <div className="flex items-center">
            <input
              type="text"
              name="searchRestaurant"
              id="searchRestaurant"
              placeholder="Buscar restaurante"
              value={formData[video.id]?.searchRestaurant || ""}
              onChange={(e) => handleInputChange(video.id, e)}
              className="w-full p-3 border border-gray-300 rounded-md"
            />
            <button
              type="button"
              onClick={() => handleSearchClick(formData[video.id]?.searchRestaurant || "")}
              className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Buscar
            </button>
          </div>
          {suggestions.length > 0 && (
            <ul className="absolute z-10 bg-white border border-gray-300 rounded-md mt-1 w-full max-h-40 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  onClick={() => handleSuggestionClick(video.id, suggestion)}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                >
                  {`${suggestion.displayName.text} - ${suggestion.formattedAddress}`}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
                    <div>
                      <label
                        htmlFor="googlePlaceId"
                        className="block text-lg font-medium text-gray-700"
                      >
                        Google Place ID:
                      </label>
                      <input
                        type="text"
                        name="googlePlaceId"
                        id="googlePlaceId"
                        placeholder="Google Place ID"
                        value={
                          formData[video.id]?.googlePlaceId ||
                          video.reviews[activeTab[video.id]].googlePlaceId ||
                          ""
                        }
                        onChange={(e) => handleInputChange(video.id, e)}
                        className="w-full p-3 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="restaurantName"
                        className="block text-lg font-medium text-gray-700"
                      >
                        Nombre del restaurante:
                      </label>
                      <input
                        type="text"
                        name="restaurantName"
                        id="restaurantName"
                        placeholder="Nombre del restaurante"
                        value={
                          formData[video.id]?.restaurantName ||
                          video.reviews[activeTab[video.id]].restaurantName ||
                          ""
                        }
                        onChange={(e) => handleInputChange(video.id, e)}
                        className="w-full p-3 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="restaurantAddress"
                        className="block text-lg font-medium text-gray-700"
                      >
                        Dirección del restaurante:
                      </label>
                      <input
                        type="text"
                        name="restaurantAddress"
                        id="restaurantAddress"
                        placeholder="Dirección del restaurante"
                        value={
                          formData[video.id]?.restaurantAddress ||
                          video.reviews[activeTab[video.id]].restaurantAddress ||
                          ""
                        }
                        onChange={(e) => handleInputChange(video.id, e)}
                        className="w-full p-3 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="restaurantPhone"
                        className="block text-lg font-medium text-gray-700"
                      >
                        Teléfono del restaurante:
                      </label>
                      <input
                        type="text"
                        name="restaurantPhone"
                        id="restaurantPhone"
                        placeholder="Teléfono del restaurante"
                        value={
                          formData[video.id]?.restaurantPhone ||
                          video.reviews[activeTab[video.id]].restaurantPhone ||
                          ""
                        }
                        onChange={(e) => handleInputChange(video.id, e)}
                        className="w-full p-3 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="restaurantWebsite"
                        className="block text-lg font-medium text-gray-700"
                      >
                        Website del restaurante:
                      </label>
                      <input
                        type="text"
                        name="restaurantWebsite"
                        id="restaurantWebsite"
                        placeholder="Website del restaurante"
                        value={
                          formData[video.id]?.restaurantWebsite ||
                          video.reviews[activeTab[video.id]].restaurantWebsite ||
                          ""
                        }
                        onChange={(e) => handleInputChange(video.id, e)}
                        className="w-full p-3 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="tripadvisorLink"
                        className="block text-lg font-medium text-gray-700"
                      >
                        Ficha de Tripadvisor:
                      </label>
                      <input
                        type="text"
                        name="tripadvisorLink"
                        id="tripadvisorLink"
                        placeholder="Ficha de Tripadvisor"
                        value={
                          formData[video.id]?.tripadvisorLink ||
                          video.reviews[activeTab[video.id]].tripadvisorLink ||
                          ""
                        }
                        onChange={(e) => handleInputChange(video.id, e)}
                        className="w-full p-3 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="googleMapsLink"
                        className="block text-lg font-medium text-gray-700"
                      >
                        Ficha de Google Maps:
                      </label>
                      <input
                        type="text"
                        name="googleMapsLink"
                        id="googleMapsLink"
                        placeholder="Ficha de Google Maps"
                        value={
                          formData[video.id]?.googleMapsLink ||
                          video.reviews[activeTab[video.id]].googleMapsLink ||
                          ""
                        }
                        onChange={(e) => handleInputChange(video.id, e)}
                        className="w-full p-3 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="googleMapsRating"
                        className="block text-lg font-medium text-gray-700"
                      >
                        Rating de Google Maps:
                      </label>
                      <input
                        type="number"
                        name="googleMapsRating"
                        id="googleMapsRating"
                        placeholder="Rating de Google Maps"
                        value={
                          formData[video.id]?.googleMapsRating ||
                          video.reviews[activeTab[video.id]].googleMapsRating ||
                          ""
                        }
                        onChange={(e) => handleInputChange(video.id, e)}
                        className="w-full p-3 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="googleMapsReviews"
                        className="block text-lg font-medium text-gray-700"
                      >
                        Número de reviews en Google Maps:
                      </label>
                      <input
                        type="number"
                        name="googleMapsReviews"
                        id="googleMapsReviews"
                        placeholder="Número de reviews en Google Maps"
                        value={
                          formData[video.id]?.googleMapsReviews ||
                          video.reviews[activeTab[video.id]].googleMapsReviews ||
                          ""
                        }
                        onChange={(e) => handleInputChange(video.id, e)}
                        className="w-full p-3 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="googleMapsPriceLevel"
                        className="block text-lg font-medium text-gray-700"
                      >
                        Price level de Google Maps:
                      </label>
                      <input
                        type="text"
                        name="googleMapsPriceLevel"
                        id="googleMapsPriceLevel"
                        placeholder="Price level de Google Maps"
                        value={
                          formData[video.id]?.googleMapsPriceLevel ||
                          video.reviews[activeTab[video.id]].googleMapsPriceLevel ||
                          ""
                        }
                        onChange={(e) => handleInputChange(video.id, e)}
                        className="w-full p-3 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="restaurantLocation"
                        className="block text-lg font-medium text-gray-700"
                      >
                        Mapa de la ubicación del lugar:
                      </label>
                      <input
                        type="text"
                        name="restaurantLocation"
                        id="restaurantLocation"
                        placeholder="Mapa de la ubicación del lugar"
                        value={
                          formData[video.id]?.restaurantLocation ||
                          video.reviews[activeTab[video.id]].restaurantLocation ||
                          ""
                        }
                        onChange={(e) => handleInputChange(video.id, e)}
                        className="w-full p-3 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="restaurantImage"
                        className="block text-lg font-medium text-gray-700"
                      >
                        Imagen del restaurante:
                      </label>
                      <input
                        type="text"
                        name="restaurantImage"
                        id="restaurantImage"
                        placeholder="Imagen del restaurante"
                        value={
                          formData[video.id]?.restaurantImage ||
                          video.reviews[activeTab[video.id]].restaurantImage ||
                          ""
                        }
                        onChange={(e) => handleInputChange(video.id, e)}
                        className="w-full p-3 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="restaurantStatus"
                        className="block text-lg font-medium text-gray-700"
                      >
                        Estado del restaurante:
                      </label>
                      <input
                        type="text"
                        name="restaurantStatus"
                        id="restaurantStatus"
                        placeholder="Estado del restaurante"
                        value={
                          formData[video.id]?.restaurantStatus ||
                          video.reviews[activeTab[video.id]].restaurantStatus ||
                          ""
                        }
                        onChange={(e) => handleInputChange(video.id, e)}
                        className="w-full p-3 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="flex justify-between">
  <button
    type="submit"
    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
  >
    Guardar Cambios
  </button>
  <button
    type="button"
    onClick={() =>
      setActiveTab((prev) => ({ ...prev, [video.id]: undefined }))
    }
    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
  >
    Cancelar
  </button>
  <button
    type="button"
    onClick={async () => {
      try {
        const videoDocRef = doc(db, "VideosToEdit", video.id);

        // Obtener las reviews actuales
        const videoDocSnapshot = await getDoc(videoDocRef);
        const currentReviews = videoDocSnapshot.data().reviews || [];

        // Eliminar la review seleccionada
        const updatedReviews = currentReviews.filter(
          (_, index) => index !== activeTab[video.id]
        );

        // Actualizar la base de datos con las reviews restantes
        await updateDoc(videoDocRef, { reviews: updatedReviews });

        // Actualizar el estado local
        setVideos((prevVideos) =>
          prevVideos.map((v) =>
            v.id === video.id ? { ...v, reviews: updatedReviews } : v
          )
        );

        // Limpiar el formulario y desactivar la pestaña activa
        setActiveTab((prev) => ({ ...prev, [video.id]: undefined }));
        setFormData((prev) => ({ ...prev, [video.id]: {} }));

        console.log("Review eliminada correctamente");
      } catch (error) {
        console.error("Error al eliminar la review:", error);
      }
    }}
    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
  >
    Eliminar
  </button>
</div>
                  </form>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
