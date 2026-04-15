// components/mw-layout/Footer.tsx
import styles from './Footer.module.css'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p>Rejas para ventanas a medida · Fabricado en España</p>

        <nav className={styles.nav}>
          <Link href="/">Categorías</Link>
          <Link href="/productos">Productos</Link>
          <Link href="/blog">Blog</Link>
        </nav>
      </div>
    </footer>
  )
}
