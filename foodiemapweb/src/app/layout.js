import Sidebar from "@/components/Sidebar";

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="flex">
        <Sidebar /> {/* Barra lateral fija */}
        {/* Contenido principal alineado a la derecha */}
        <main className="flex-1 p-6 ml-64"> {/* Ajusta ml-64 para dejar espacio para la barra lateral */}
          {children} {/* Aquí se renderiza el contenido de cada página */}
        </main>
      </body>
    </html>
  );
}
