import Sidebar from "@/components/Sidebar";
import styles from "./page.module.css";

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="flex">
        <Sidebar /> {/* Barra lateral fija */}
        {/* Contenido principal alineado a la derecha */}
        <main className={styles.page}> {/* Ajusta ml-64 para dejar espacio para la barra lateral */}
          {children} {/* Aquí se renderiza el contenido de cada página */}
        </main>
      </body>
    </html>
  );
}
