import Link from "next/link";
import styles from "./Sidebar.module.css"; // Importa el archivo CSS

const Sidebar = () => {
  return (
    <div className={styles.sidebar}> {/* Barra lateral */}
      <h2>Admin Panel</h2>
      <nav>
        {/* Usa el componente Link sin envolverlo con un <a> */}
        <Link href="/edit_reviewers">
          <span className={styles['nav-link']}>Edit Reviews</span> {/* Usamos un span o cualquier otro elemento */}
        </Link>
        <Link href="/edit_restaurants">
          <span className={styles['nav-link']}>Edit Restaurants</span>
        </Link>
        <Link href="/edit_videos">
          <span className={styles['nav-link']}>Edit Videos</span>
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;
