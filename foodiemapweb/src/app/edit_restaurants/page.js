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
  const [editingRestaurant, setEditingRestaurant] = useState(null); // Track the restaurant being edited
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

  const handleInputChange = (id, field, value) => {
    setRestaurants((prevRestaurants) =>
      prevRestaurants.map((restaurant) =>
        restaurant.id === id ? { ...restaurant, [field]: value } : restaurant
      )
    );
  };

  const handleSave = async (id) => {
    const restaurant = restaurants.find((r) => r.id === id);
    try {
      const restaurantRef = doc(db, "Restaurants", id);
      await updateDoc(restaurantRef, {
        name: restaurant.name,
        address: restaurant.address,
        phone: restaurant.phone,
        website: restaurant.website,
        googleMapsRating: restaurant.googleMapsRating,
        googleMapsReviews: restaurant.googleMapsReviews,
        googleMapsPriceLevel: restaurant.googleMapsPriceLevel,
        status: restaurant.status,
        image: restaurant.image,
        location: restaurant.location, // Guardar la ubicación actualizada
      });
      alert("Restaurante actualizado correctamente.");
      setEditingRestaurant(null);
    } catch (error) {
      console.error("Error al actualizar el restaurante:", error);
      alert("Hubo un error al actualizar el restaurante.");
    }
  };

  useEffect(() => {
    fetchTotalRestaurants();
    fetchRestaurants(currentPage);
  }, [currentPage]);

  return (
    <div className="flex flex-col items-center bg-white min-h-screen py-8">
      <h1 className="text-center text-blue-700 text-4xl font-extrabold mb-6">LISTA DE RESTAURANTES</h1>
      <div className="w-full max-w-4xl bg-gray-100 shadow-lg rounded-lg p-6">
        {loading && <p className="text-gray-500 text-center">Cargando...</p>}
        <ul>
          {restaurants.map((restaurant) => (
            <li key={restaurant.id} className="border-b pb-4 mb-4">
              {editingRestaurant === restaurant.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSave(restaurant.id);
                  }}
                  className="space-y-4"
                >
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
                    <label className="block text-lg font-medium text-gray-700">Website:</label>
                    <input
                      type="text"
                      value={restaurant.website}
                      onChange={(e) => handleInputChange(restaurant.id, "website", e.target.value)}
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
                    <label className="block text-lg font-medium text-gray-700">Número de Reviews:</label>
                    <input
                      type="number"
                      value={restaurant.googleMapsReviews}
                      onChange={(e) =>
                        handleInputChange(restaurant.id, "googleMapsReviews", e.target.value)
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
                  <div>
                    <label className="block text-lg font-medium text-gray-700">Ubicación:</label>
                    <input
                      type="text"
                      value={restaurant.location || ""}
                      onChange={(e) => handleInputChange(restaurant.id, "location", e.target.value)}
                      placeholder="Latitud, Longitud"
                      className="w-full p-3 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <MapContainer
                      center={
                        restaurant.location
                          ? restaurant.location.split(",").map(Number)
                          : [40.4168, -3.7038]
                      }
                      zoom={13}
                      style={{ height: "400px", width: "100%" }}
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
  <h3 className="text-xl font-semibold text-gray-800">{restaurant.name}</h3>
  <p className="text-sm text-gray-500">Dirección: {restaurant.address}</p>
  <p className="text-sm text-gray-500">Teléfono: {restaurant.phone}</p>
  <p className="text-sm text-gray-500">Rating: {restaurant.googleMapsRating}</p>
  <p className="text-sm text-gray-500">Reviews: {restaurant.reviews?.length || 0}</p>
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
  <button
    onClick={() => setEditingRestaurant(restaurant.id)}
    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 mt-4"
  >
    Editar
  </button>
</div>
              )}
            </li>
          ))}
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