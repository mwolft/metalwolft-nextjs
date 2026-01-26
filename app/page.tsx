export const metadata = {
  title: "Rejas para ventanas a medida",
  description:
    "Rejas para ventanas a medida fabricadas en metal. Modelos fijos, abatibles y correderos, fabricados en España.",
  openGraph: {
    type: "website",
  },
};

export default function HomePage() {
  return (
    <section
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "2rem 1rem",
      }}
    >
      <h1>Rejas para ventanas a medida</h1>

      <p>
        Fabricamos rejas para ventanas a medida, combinando seguridad, diseño y
        fabricación artesanal en metal.
      </p>

      <nav style={{ marginTop: "2rem" }}>
        <ul style={{ display: "flex", gap: "2rem", padding: 0, listStyle: "none" }}>
          <li>
            <a href="/rejas-para-ventanas/fijas">Rejas fijas</a>
          </li>
          <li>
            <a href="/rejas-para-ventanas/abatibles">Rejas abatibles</a>
          </li>
          <li>
            <a href="/rejas-para-ventanas/correderas">Rejas correderas</a>
          </li>
        </ul>
      </nav>
    </section>
  );
}
