"use client";

import { useState, useEffect } from "react";
import { db } from "../../components/firebaseConfig.js";
import { collection, getDocs, query, orderBy, limit, startAt } from "firebase/firestore";

export default function ListVideos() {
  const [videos, setVideos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const videosPerPage = 1;

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
          </div>
        ))}
      </div>
    </div>
  );
}
