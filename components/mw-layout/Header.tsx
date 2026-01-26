import styles from './Header.module.css'
import Link from 'next/link'

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          MetalWolft
        </Link>

        <nav className={styles.nav}>
          <Link href="/rejas-para-ventanas/fijas">Fijas</Link>
          <Link href="/rejas-para-ventanas/abatibles">Abatibles</Link>
          <Link href="/rejas-para-ventanas/correderas">Correderas</Link>
        </nav>

        <Link href="/carrito" className={styles.cart}>
          Carrito
        </Link>
      </div>
    </header>
  )
}