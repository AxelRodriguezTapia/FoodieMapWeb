"use client";

import { useState, useEffect } from "react";
import { db } from "../../components/firebaseConfig.js";
import { collection, getDocs, query, orderBy, limit, startAt, doc, updateDoc } from "firebase/firestore";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Configuración del icono del marcador
const markerIcon = L.icon({
  iconUrl: "/images/marker.png", // Cambia esta ruta si tienes un icono personalizado
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export default function ListRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [currentReviewPage, setCurrentReviewPage] = useState({}); // Track review page for each restaurant
  const reviewsPerPage = 1; // Number of reviews per page
  const restaurantsPerPage = 1;

  const fetchTotalRestaurants = async () => {
    const restaurantsCollection = collection(db, "Restaurants");
    const restaurantSnapshot = await getDocs(restaurantsCollection);
    setTotalPages(Math.ceil(restaurantSnapshot.size / restaurantsPerPage));
  };

  const fetchRestaurants = async (page = 1) => {
    setLoading(true);
    try {
      const restaurantsCollection = collection(db, "Restaurants");
      let restaurantsQuery = query(
        restaurantsCollection,
        orderBy("name", "asc"),
        limit(restaurantsPerPage)
      );

      if (page > 1) {
        const offset = (page - 1) * restaurantsPerPage;
        const allDocs = await getDocs(query(restaurantsCollection, orderBy("name", "asc")));
        const startDoc = allDocs.docs[offset];
        if (startDoc) {
          restaurantsQuery = query(
            restaurantsCollection,
            orderBy("name", "asc"),
            startAt(startDoc),
            limit(restaurantsPerPage)
          );
        }
      }

      const restaurantSnapshot = await getDocs(restaurantsQuery);
      setRestaurants(restaurantSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching restaurants: ", error);
    }
    setLoading(false);
  };

  const handleReviewPagination = (restaurantId, page) => {
    setCurrentReviewPage((prev) => ({
      ...prev,
      [restaurantId]: page,
    }));
  };

  useEffect(() => {
    fetchTotalRestaurants();
    fetchRestaurants(currentPage);
  }, [currentPage]);

  const handleInputChange = (restaurantId, field, value) => {
    setRestaurants((prevRestaurants) =>
      prevRestaurants.map((restaurant) =>
        restaurant.id === restaurantId ? { ...restaurant, [field]: value } : restaurant
      )
    );
  };

  const handleSave = async (restaurantId) => {
    const restaurantToUpdate = restaurants.find((restaurant) => restaurant.id === restaurantId);
    if (restaurantToUpdate) {
      const restaurantDoc = doc(db, "Restaurants", restaurantId);
      await updateDoc(restaurantDoc, restaurantToUpdate);
      setEditingRestaurant(null);
    }
  };

  return (
    <div className="flex flex-col items-center bg-white min-h-screen py-8">
      <h1 className="text-center text-blue-700 text-4xl font-extrabold mb-6">LISTA DE RESTAURANTES</h1>
      <div className="w-full max-w-4xl bg-gray-100 shadow-lg rounded-lg p-6">
        {loading && <p className="text-gray-500 text-center">Cargando...</p>}
        <ul>
          {restaurants.map((restaurant) => {
            const reviewPage = currentReviewPage[restaurant.id] || 1;
            const totalReviewPages = Math.ceil((restaurant.reviews?.length || 0) / reviewsPerPage);
            const paginatedReviews = restaurant.reviews?.slice(
              (reviewPage - 1) * reviewsPerPage,
              reviewPage * reviewsPerPage
            );

            return (
              <li key={restaurant.id} className="border-b pb-4 mb-4">
                <div className="space-y-4">
                  {editingRestaurant === restaurant.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSave(restaurant.id);
                      }}
                      className="space-y-4"
                    >
                      {/* Campos editables */}
                      <div>
                        <label className="block text-lg font-medium text-gray-700">Nombre:</label>
                        <input
                          type="text"
                          value={restaurant.name}
                          onChange={(e) => handleInputChange(restaurant.id, "name", e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-lg font-medium text-gray-700">Dirección:</label>
                        <input
                          type="text"
                          value={restaurant.address}
                          onChange={(e) => handleInputChange(restaurant.id, "address", e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-lg font-medium text-gray-700">Teléfono:</label>
                        <input
                          type="text"
                          value={restaurant.phone}
                          onChange={(e) => handleInputChange(restaurant.id, "phone", e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-lg font-medium text-gray-700">Rating:</label>
                        <input
                          type="number"
                          value={restaurant.googleMapsRating}
                          onChange={(e) =>
                            handleInputChange(restaurant.id, "googleMapsRating", e.target.value)
                          }
                          className="w-full p-3 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-lg font-medium text-gray-700">Estado:</label>
                        <input
                          type="text"
                          value={restaurant.status}
                          onChange={(e) => handleInputChange(restaurant.id, "status", e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-lg font-medium text-gray-700">Imagen:</label>
                        <input
                          type="text"
                          value={restaurant.image}
                          onChange={(e) => handleInputChange(restaurant.id, "image", e.target.value)}
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
                          onClick={() => setEditingRestaurant(null)}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      {/* Vista normal */}
                      <h3 className="text-xl font-semibold text-gray-800">{restaurant.name}</h3>
                      <p className="text-sm text-gray-500">
                        <strong>Dirección:</strong> {restaurant.address}
                      </p>
                      <p className="text-sm text-gray-500">
                        <strong>Teléfono:</strong> {restaurant.phone}
                      </p>
                      <p className="text-sm text-gray-500">
                        <strong>Rating:</strong> {restaurant.googleMapsRating}
                      </p>
                      <p className="text-sm text-gray-500">
                        <strong>Reviews:</strong> {restaurant.reviews?.length || 0}
                      </p>
                      <button
                        onClick={() => setEditingRestaurant(restaurant.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 mt-4"
                      >
                        Editar
                      </button>
                    </div>
                  )}

                  {/* Mapa */}
                  <div className="mt-4">
                    <MapContainer
                      center={
                        restaurant.location
                          ? restaurant.location.split(",").map(Number)
                          : [40.4168, -3.7038]
                      }
                      zoom={13}
                      style={{ height: "300px", width: "100%" }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      {restaurant.location && (
                        <Marker
                          position={restaurant.location.split(",").map(Number)}
                          icon={markerIcon}
                        >
                          <Popup>{restaurant.name}</Popup>
                        </Marker>
                      )}
                    </MapContainer>
                  </div>

                  {/* Reviews */}
                  <div className="mt-4">
                    <h4 className="text-lg font-semibold text-gray-700">Reviews:</h4>
                    {paginatedReviews && paginatedReviews.length > 0 ? (
                      paginatedReviews.map((review, index) => (
                        <div key={index} className="mt-4 space-y-2">
                          <p className="text-sm text-gray-600">
                            <strong>Título del Video:</strong> {review.videoTitle}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Inicio de la Review:</strong> {review.reviewStartTime}
                          </p>
                          <iframe
                            className="rounded-lg shadow-md w-full h-64"
                            src={`https://www.youtube.com/embed/${review.videoPlatformReviewId}`}
                            title={`Video ${index + 1}`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No hay reviews disponibles.</p>
                    )}

                    {/* Paginación de reviews */}
                    <div className="flex justify-center items-center mt-4">
                      <button
                        onClick={() => handleReviewPagination(restaurant.id, Math.max(reviewPage - 1, 1))}
                        disabled={reviewPage === 1}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 mx-1"
                      >
                        Anterior
                      </button>
                      {[...Array(totalReviewPages)].map((_, index) => (
                        <button
                          key={index}
                          onClick={() => handleReviewPagination(restaurant.id, index + 1)}
                          className={`px-4 py-2 mx-1 rounded-lg ${
                            reviewPage === index + 1 ? "bg-red-600 text-white" : "bg-gray-300 text-gray-700"
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          handleReviewPagination(restaurant.id, Math.min(reviewPage + 1, totalReviewPages))
                        }
                        disabled={reviewPage === totalReviewPages}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 mx-1"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex justify-center items-center mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 mx-1"
          >
            Anterior
          </button>
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`px-4 py-2 mx-1 rounded-lg ${
                currentPage === index + 1 ? "bg-red-600 text-white" : "bg-gray-300 text-gray-700"
              }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 mx-1"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}